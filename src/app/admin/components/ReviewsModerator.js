'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/ui/DataTable';
import EmptyState from '@/components/admin/ui/EmptyState';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';

export default function ReviewsModerator({ password }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      setReviews(await adminFetch('/api/admin/reviews', { password }));
    } catch (err) {
      toast.error(`Erro ao carregar avaliações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      await adminFetch('/api/admin/reviews', { password, method: 'PUT', body: { reviewId, status: newStatus } });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r)));
    } catch (err) {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Excluir avaliação',
      message: 'Excluir esta avaliação permanentemente?',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/reviews?id=${id}`, { password, method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(`Erro ao excluir avaliação: ${err.message}`);
    }
  };

  const filteredReviews = reviews.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div>
      <h3 className="text-lg text-base-content font-bold mb-6">Avaliações</h3>

      <DataTable
        loading={loading}
        isEmpty={filteredReviews.length === 0}
        emptyState={<EmptyState icon="fa-star" title="Nenhuma avaliação corresponde ao filtro selecionado." />}
        filters={
          <select className="select select-bordered select-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas as Avaliações</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
        }
        actions={
          <button onClick={fetchReviews} className="btn btn-sm btn-outline">
            <i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Atualizar
          </button>
        }
      >
        <table className="table table-zebra table-md w-full">
          <thead className="bg-base-200">
            <tr>
              <th>Produto</th>
              <th>Cliente</th>
              <th className="text-center">Nota</th>
              <th>Comentário</th>
              <th>Data</th>
              <th className="text-center">Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id} className="hover">
                <td className="font-bold text-base-content max-w-[200px] truncate" title={review.product_title}>
                  {review.product_title}
                </td>
                <td>{review.customer_name}</td>
                <td className="text-center">
                  <div className="flex justify-center gap-0.5 text-warning" aria-label={`Nota ${review.rating} de 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={i < review.rating ? 'fa-solid fa-star text-xs' : 'fa-regular fa-star text-xs'} aria-hidden="true"></i>
                    ))}
                  </div>
                </td>
                <td className="max-w-[250px] truncate" title={review.comment || '(Sem comentário)'}>
                  {review.comment || <span className="italic text-base-content/40">Sem comentário</span>}
                </td>
                <td className="whitespace-nowrap text-xs text-base-content/60">
                  {new Date(review.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="text-center">
                  <StatusBadge domain="review" status={review.status} />
                </td>
                <td className="text-right">
                  <div className="flex gap-1 justify-end">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                        className="btn btn-xs btn-success text-success-content gap-1"
                        title="Aprovar depoimento no site"
                      >
                        <i className="fa-solid fa-check" aria-hidden="true"></i> Aprovar
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                        className="btn btn-xs btn-warning text-warning-content gap-1"
                        title="Ocultar do site"
                      >
                        <i className="fa-solid fa-ban" aria-hidden="true"></i> Rejeitar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="btn btn-xs btn-error btn-outline"
                      aria-label={`Excluir avaliação de ${review.customer_name}`}
                      title="Deletar permanentemente"
                    >
                      <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
