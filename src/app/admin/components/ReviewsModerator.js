'use client';

import { useState, useEffect } from 'react';

export default function ReviewsModerator({ password }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews?auth=${encodeURIComponent(password)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: newStatus })
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
      } else {
        alert('Erro ao atualizar status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        alert('Erro ao excluir avaliação.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div>
      <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
        <div className="card-body p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-base-content tracking-tight">Avaliações dos Clientes</h2>
              <p className="text-xs text-base-content/60 mt-1">Gerencie a reputação e depoimentos de produtos enviados pelos clientes.</p>
            </div>
            <div className="flex gap-2">
              <select 
                className="select select-bordered select-sm h-10"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">Todas as Avaliações</option>
                <option value="pending">🟡 Pendentes</option>
                <option value="approved">🟢 Aprovadas</option>
                <option value="rejected">🔴 Rejeitadas</option>
              </select>
              <button onClick={fetchReviews} className="btn btn-sm btn-outline h-10 min-h-10">
                <i className="fa-solid fa-arrows-rotate"></i> Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-base-content/60">Carregando avaliações...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="card bg-base-100 border border-base-200 p-10 text-center italic text-base-content/60">
          Nenhuma avaliação correspondente ao filtro encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
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
              {filteredReviews.map(review => (
                <tr key={review.id} className="hover">
                  <td className="font-bold text-base-content max-w-[200px] truncate" title={review.product_title}>
                    {review.product_title}
                  </td>
                  <td>{review.customer_name}</td>
                  <td className="text-center">
                    <div className="flex justify-center gap-0.5 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} className={i < review.rating ? "fa-solid fa-star text-xs" : "fa-regular fa-star text-xs"}></i>
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
                    <div className={`badge font-bold text-[10px] uppercase tracking-wider px-2 py-1.5 justify-center ${
                      review.status === 'approved' ? 'badge-success bg-success/20 border-success text-success-content' :
                      review.status === 'rejected' ? 'badge-error bg-error/20 border-error text-error-content' :
                      'badge-warning bg-warning/20 border-warning text-warning-content'
                    }`}>
                      {review.status === 'approved' ? 'Aprovada' :
                       review.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      {review.status !== 'approved' && (
                        <button 
                          onClick={() => handleUpdateStatus(review.id, 'approved')}
                          className="btn btn-xs btn-success text-success-content gap-1"
                          title="Aprovar depoimento no site"
                        >
                          <i className="fa-solid fa-check"></i> Aprovar
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button 
                          onClick={() => handleUpdateStatus(review.id, 'rejected')}
                          className="btn btn-xs btn-warning text-warning-content gap-1"
                          title="Ocultar do site"
                        >
                          <i className="fa-solid fa-ban"></i> Rejeitar
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="btn btn-xs btn-error btn-outline"
                        title="Deletar permanentemente"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
