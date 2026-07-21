'use client';

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import Modal from '@/components/admin/ui/Modal';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { useDebouncedValue } from '@/components/admin/hooks/useDebouncedValue';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';

const STATUS_LABELS = { pending: 'Pendente', viewed: 'Visualizado', completed: 'Finalizado', cancelled: 'Cancelado' };

const STATUS_SELECT_CLASS = {
  pending: 'bg-warning/20 border-warning/30 text-warning hover:bg-warning/35',
  viewed: 'bg-info/20 border-info/30 text-info hover:bg-info/35',
  completed: 'bg-success/20 border-success/30 text-success hover:bg-success/35',
  cancelled: 'bg-error/20 border-error/30 text-error hover:bg-error/35',
};

// "processing" era o valor (errado) que o dropdown antigo do admin gravava no lugar de
// "pending" — dado real já existente no banco por causa desse bug histórico, não um valor
// que voltamos a oferecer como opção. Tratado aqui só para exibir corretamente o legado.
const LEGACY_STATUS_ALIASES = { processing: 'pending' };
const KNOWN_STATUSES = [...Object.keys(STATUS_LABELS), ...Object.keys(LEGACY_STATUS_ALIASES)];
const normalizeStatus = (status) => LEGACY_STATUS_ALIASES[status] || status;

// Cor neutra para status fora dos valores conhecidos — evita que o <select> nativo
// caia silenciosamente no 1º <option> ("Pendente") quando o valor gravado no pedido
// não corresponde a nenhuma opção (dado legado/inconsistente no banco).
const STATUS_FALLBACK_CLASS = 'bg-base-300 border-base-content/20 text-base-content/70 hover:bg-base-300';

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('pt-BR');
}

// Extraído de page.js: aba "Orçamentos" (filtros + tabela + modal de detalhes + impressão + CSV).
export default function OrdersManager({ orders, sellers, products, role, password, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  const debouncedSearch = useDebouncedValue(search, 250);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== '') {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (sellerFilter !== '') {
      result =
        sellerFilter === 'direto'
          ? result.filter((o) => !o.seller_id)
          : result.filter((o) => o.seller_id === Number(sellerFilter));
    }
    if (startDate !== '') {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.created_at) >= start);
    }
    if (endDate !== '') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.created_at) <= end);
    }
    if (debouncedSearch.trim() !== '') {
      const fuse = new Fuse(result, { keys: ['customer_name', 'id'], threshold: 0.4 });
      result = fuse.search(debouncedSearch).map((item) => item.item);
    }

    return result;
  }, [orders, statusFilter, sellerFilter, startDate, endDate, debouncedSearch]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminFetch('/api/admin/orders', { password, method: 'PUT', body: { orderId, status: newStatus } });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const handleDelete = async (orderId) => {
    if (role !== 'admin') {
      toast.error('Apenas Administradores podem excluir pedidos.');
      return;
    }
    const ok = await confirm({
      title: 'Excluir pedido',
      message: 'Excluir este pedido permanentemente?',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/orders?id=${orderId}`, { password, method: 'DELETE' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao excluir pedido: ${err.message}`);
    }
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');
      return;
    }
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 6px 0; font-size: 13px;">${item.quantity}x ${item.product_title}</td>
        <td style="padding: 6px 0; font-size: 13px; text-align: right;">${
          item.price
            ? `<span style="font-size: 10px; font-weight: normal;">R$</span> ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'Sob consulta'
        }</td>
      </tr>
    `
      )
      .join('');

    const totalStr = order.items
      .reduce((acc, item) => acc + (item.price ? item.price * item.quantity : 0), 0)
      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - Pedido #${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; background-color: #fff; }
            h2 { text-align: center; margin: 5px 0; font-size: 18px; }
            p { font-size: 12px; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>ANTENOR & FILHOS</h2>
          <p style="text-align: center;">Estrada União Indústria, 12273 - Itaipava</p>
          <div class="divider"></div>
          <p><b>Pedido:</b> #${order.id}</p>
          <p><b>Data:</b> ${formatDate(order.created_at)}</p>
          <p><b>Cliente:</b> ${order.customer_name}</p>
          <p><b>WhatsApp:</b> ${order.customer_whatsapp}</p>
          ${order.customer_address ? `<p><b>Entrega:</b> ${order.customer_address}</p>` : ''}
          ${order.delivery_date ? `<p><b>Agenda Entrega:</b> ${order.delivery_date.split('-').reverse().join('/')} (${order.delivery_period || 'Qualquer Horário'})</p>` : ''}
          <p><b>Atendente:</b> ${order.seller_name || 'Site Direto'}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; font-size: 12px; padding: 4px 0;">Item</th>
                <th style="text-align: right; font-size: 12px; padding: 4px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <p class="total">Total Estimado: <span style="font-size: 11px; font-weight: normal;">R$</span> ${totalStr}</p>
          ${order.notes ? `<p style="font-size: 11px; margin-top: 10px;"><b>Obs:</b> ${order.notes}</p>` : ''}
          <div class="divider"></div>
          <p style="text-align: center; font-size: 10px;">Obrigado pela preferência!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Não há orçamentos filtrados para exportar.');
      return;
    }
    const headers = ['Pedido ID', 'Data', 'Cliente', 'WhatsApp', 'Email', 'Endereco de Entrega', 'Vendedor', 'Status', 'Itens Requisitados', 'Observacoes'];
    const rows = filteredOrders.map((o) => {
      const itemStrings = o.items.map((i) => `${i.quantity}x ${i.product_title} [EAN:${i.sku || ''}]`).join(' | ');
      return [
        o.id,
        formatDate(o.created_at),
        o.customer_name,
        o.customer_whatsapp,
        o.customer_email || '',
        o.customer_address || '',
        o.seller_name || 'Site Direto',
        o.status,
        itemStrings,
        o.notes || '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,﻿' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_antenorefilhos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h3 className="text-lg text-base-content font-bold mb-6">Orçamentos</h3>

      <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
        <div className="card-body p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-primary" aria-hidden="true"></i> Filtros de Pesquisa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs uppercase font-bold text-base-content/60">Pesquisa</span>
              </label>
              <input
                type="text"
                placeholder="Cliente ou ID..."
                className="input input-bordered w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs uppercase font-bold text-base-content/60">Status</span>
              </label>
              <select className="select select-bordered w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos os Status</option>
                <option value="pending">🟡 Pendente</option>
                <option value="viewed">🔵 Visualizado</option>
                <option value="completed">🟢 Finalizado</option>
                <option value="cancelled">🔴 Cancelado</option>
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs uppercase font-bold text-base-content/60">Vendedor</span>
              </label>
              <select className="select select-bordered w-full" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                <option value="">Filtrar por Vendedor</option>
                <option value="direto">Site Direto</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs uppercase font-bold text-base-content/60">Data Inicial</span>
              </label>
              <input type="date" className="input input-bordered w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs uppercase font-bold text-base-content/60">Data Final</span>
              </label>
              <input type="date" className="input input-bordered w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="form-control w-full">
              <button onClick={exportToCSV} className="btn btn-outline btn-primary w-full gap-2 h-[48px] min-h-[48px]">
                <i className="fa-solid fa-file-csv text-lg" aria-hidden="true"></i> Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-base-content/60 italic p-4">Nenhum pedido de orçamento corresponde aos filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
          <table className="table table-zebra table-sm md:table-md w-full">
            <thead className="bg-base-200">
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Vendedor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover">
                  <td className="font-mono text-xs">#{String(order.id).slice(0, 8)}</td>
                  <td className="whitespace-nowrap">
                    <div>{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-base-content/55 font-mono">
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{order.customer_name}</div>
                    {order.customer_address && (
                      <div className="text-xs text-base-content/60 truncate max-w-[150px]" title={order.customer_address}>
                        Entrega: {order.customer_address}
                      </div>
                    )}
                  </td>
                  <td>
                    <a
                      href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-success hover:text-success/80 font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                      <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true"></i>
                      {order.customer_whatsapp}
                    </a>
                  </td>
                  <td>{order.seller_name || <span className="text-base-content/50 italic">Site Direto</span>}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label={`Status do pedido #${order.id}`}
                      title={!KNOWN_STATUSES.includes(order.status) ? `Status não reconhecido: "${order.status}"` : undefined}
                      className={`select select-xs font-bold uppercase text-xs tracking-wider text-center ${STATUS_SELECT_CLASS[normalizeStatus(order.status)] || STATUS_FALLBACK_CLASS} focus:outline-none focus:ring-0 focus:border-current cursor-pointer`}
                      style={{ textAlignLast: 'center', minWidth: '120px' }}
                    >
                      <option value="pending" className="bg-base-100 text-warning font-bold">Pendente</option>
                      <option value="processing" hidden className="bg-base-100 text-warning font-bold">Pendente</option>
                      <option value="viewed" className="bg-base-100 text-info font-bold">Visualizado</option>
                      <option value="completed" className="bg-base-100 text-success font-bold">Finalizado</option>
                      <option value="cancelled" className="bg-base-100 text-error font-bold">Cancelado</option>
                      {!KNOWN_STATUSES.includes(order.status) && (
                        <option value={order.status} className="bg-base-100 text-base-content/70 font-bold">
                          {order.status || 'Desconhecido'}
                        </option>
                      )}
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => setSelectedOrder(order)} className="btn btn-sm btn-primary btn-outline font-semibold">
                        Detalhes
                      </button>
                      <button
                        onClick={() => handlePrint(order)}
                        className="btn btn-sm btn-ghost text-base-content/70 hover:text-primary hover:bg-primary/10"
                        aria-label={`Imprimir cupom do pedido #${order.id}`}
                        title="Imprimir Cupom"
                      >
                        <i className="fa-solid fa-print" aria-hidden="true"></i>
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="btn btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10"
                          aria-label={`Excluir pedido #${order.id}`}
                          title="Excluir"
                        >
                          <i className="fa-solid fa-trash" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, products, onClose, onPrint }) {
  const totalPrice = order.items.reduce((sum, item) => (item.price ? sum + item.price * item.quantity : sum), 0);
  const hasPrice = order.items.some((item) => item.price);

  return (
    <Modal open onClose={onClose} title={`Pedido #${order.id}`} subtitle={formatDate(order.created_at)} size="lg">
      <div className="flex flex-col gap-6">
        <StatusBadge domain="order" status={normalizeStatus(order.status)} className="w-fit" />

        <div className={`alert ${order.seller_name ? 'alert-warning bg-warning/10 text-warning-content border-warning/20' : 'alert-info bg-info/10 text-info-content border-info/20'}`}>
          <span className="text-2xl">{order.seller_name ? '🤝' : '🌐'}</span>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider opacity-70">Origem do Pedido</h3>
            <div className="text-lg font-bold">
              {order.seller_name ? `Indicação de ${order.seller_name}` : 'Site Direto (sem indicação)'}
            </div>
            {order.seller_name && <div className="text-xs opacity-70 mt-1">Este pedido veio através de link de vendedor</div>}
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-base-content/60 mb-3 font-bold">Dados do Cliente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-base-200 p-4 rounded-box border border-base-300">
              <div className="text-xs text-base-content/60 mb-1 font-bold">NOME</div>
              <div className="text-sm font-bold text-base-content">{order.customer_name}</div>
            </div>
            <div className="bg-base-200 p-4 rounded-box border border-base-300">
              <div className="text-xs text-base-content/60 mb-1 font-bold">WHATSAPP</div>
              <a
                href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success hover:text-success/80 font-bold flex items-center gap-2 text-sm w-fit"
              >
                <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true"></i>
                {order.customer_whatsapp}
              </a>
            </div>
            {order.customer_address && (
              <div className="bg-base-200 p-4 rounded-box border border-base-300 md:col-span-2">
                <div className="text-xs text-base-content/60 mb-1 font-bold">ENDEREÇO DE ENTREGA</div>
                <div className="text-sm text-base-content">{order.customer_address}</div>
              </div>
            )}
            {order.delivery_date && (
              <div className="bg-base-200 p-4 rounded-box border border-base-300 md:col-span-2">
                <div className="text-xs text-base-content/60 mb-1 font-bold">AGENDA DE ENTREGA</div>
                <div className="text-sm font-bold text-primary flex items-center gap-2">
                  <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
                  {order.delivery_date.split('-').reverse().join('/')} - Período: {order.delivery_period || 'Qualquer Horário'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-base-content/60 mb-3 font-bold">
            Itens do Pedido ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
          </h4>
          <div className="flex flex-col gap-2">
            {order.items.map((item, idx) => {
              const matchProd = products.find((p) => p.title === item.product_title);
              return (
                <div key={item.id || idx} className="flex items-center gap-4 p-3 bg-base-200 border border-base-300 rounded-box">
                  {matchProd?.image_url ? (
                    <img src={matchProd.image_url} alt={matchProd.title} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-base-300 rounded flex items-center justify-center text-xl">🥩</div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-bold text-base-content mb-1 leading-tight">
                      <span className="text-primary mr-2">{item.quantity}×</span>
                      {item.product_title}
                    </div>
                    {item.sku && <div className="text-xs text-base-content/60 font-mono">EAN: {item.sku}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    {item.price ? (
                      <span className="text-sm font-bold text-primary">{formatCurrencyBRL(item.price * item.quantity)}</span>
                    ) : (
                      <span className="text-xs text-base-content/60 italic">Sob consulta</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasPrice && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-box flex justify-between items-center">
              <span className="text-xs text-primary/80 uppercase tracking-wider font-bold">Total (itens com preço)</span>
              <span className="text-lg font-bold text-primary">{formatCurrencyBRL(totalPrice)}</span>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="alert alert-warning bg-warning/10 border-warning/30 text-warning-content items-start">
            <i className="fa-solid fa-note-sticky mt-1" aria-hidden="true"></i>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider opacity-70">Observações do Cliente</h3>
              <div className="text-sm mt-1">{order.notes}</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-base-200">
          <button onClick={() => onPrint(order)} className="btn btn-outline btn-primary">
            <i className="fa-solid fa-print" aria-hidden="true"></i> Imprimir Cupom
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
