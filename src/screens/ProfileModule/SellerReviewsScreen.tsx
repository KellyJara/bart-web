import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reviewService } from '../../redux/services/reviewService';
import { Review, SellerReviewsResponse } from '../../redux/types/review.type';
import ReviewCard from '../../components/ReviewCard';
import { Stars } from '../../components/StarRating';
import { REVIEW_POINTS } from '../../utils/levels';
import { BackButton, PageLoader, Spinner } from '../../components/ui';
import '../../styles/seller.css';

/**
 * Todas las reseñas de un vendedor: promedio, cuántas hay de cada estrella y la lista.
 * Pueden calificar quienes le compraron o recibieron un regalo (el vendedor gana puntos por cada reseña).
 */
const SellerReviewsScreen = () => {
  const { sellerId = '' } = useParams();

  const [summary, setSummary] = useState<SellerReviewsResponse['summary'] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reviewService.getSellerReviews(sellerId);
      setSummary(res.data.summary);
      setReviews(res.data.reviews);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.log('Error cargando reseñas:', err);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !reviews.length) return;
    setLoadingMore(true);
    try {
      const res = await reviewService.getSellerReviews(sellerId, reviews[reviews.length - 1].createdAt);
      setReviews(prev => [...prev, ...res.data.reviews]);
      setHasMore(res.data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <PageLoader />;

  const total = summary?.count ?? 0;

  return (
    <div className="page page--narrow">
      <BackButton />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Reseñas</h1>

      {summary && total > 0 && (
        <div className="card card--white rating-summary" style={{ marginBottom: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <p className="rating-summary__avg">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size={16} />
            <p className="meta" style={{ marginTop: 4 }}>{total} {total === 1 ? 'reseña' : 'reseñas'}</p>
          </div>
          <div className="grow stack" style={{ gap: 4 }}>
            {(['5', '4', '3', '2', '1'] as const).map(star => {
              const n = summary.distribution[star] ?? 0;
              return (
                <div key={star} className="bar-row">
                  <span style={{ width: 22 }}>{star}★</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ display: 'block', width: `${(n / total) * 100}%` }} />
                  </span>
                  <span style={{ width: 22, textAlign: 'right' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary && total > 0 && (
        <p className="hint" style={{ marginBottom: 16 }}>
          🏅 Pueden calificar quienes le compraron o recibieron un regalo. Cada reseña le suma {REVIEW_POINTS} puntos.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="empty">
          <div className="sl-empty-emoji">⭐</div>
          <p className="sl-empty-title">Aún no hay reseñas</p>
          <p>
            Este vendedor todavía no tiene reseñas. Solo pueden calificar quienes le compraron o recibieron un
            regalo de él.
          </p>
        </div>
      ) : (
        <>
          {total > 0 && <h2 className="section-title">Lo que dicen los compradores</h2>}
          <div className="list">
            {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
          </div>
        </>
      )}

      {hasMore && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          {loadingMore ? (
            <Spinner small />
          ) : (
            <button type="button" className="btn btn--outline btn--sm" onClick={loadMore}>Ver más reseñas</button>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerReviewsScreen;
