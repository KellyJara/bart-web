import { Review } from '../redux/types/review.type';
import { Stars } from './StarRating';
import { Avatar } from './ui';
import { formatDate } from '../utils/format';
import '../styles/seller.css';

/** Una reseña: quién la escribió, estrellas, comentario y el producto del trato (venta o regalo). */
const ReviewCard = ({ review }: { review: Review }) => {
  const reviewer = typeof review.reviewer === 'object' ? review.reviewer : null;
  const product = review.product && typeof review.product === 'object' ? review.product : null;

  return (
    <div className="card card--white">
      <div className="row">
        <Avatar src={reviewer?.profileImg} size={40} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="ellipsis" style={{ fontWeight: 700 }}>{reviewer?.username ?? 'Usuario'}</div>
          <div className="meta">{formatDate(review.createdAt)}</div>
        </div>
        <Stars value={review.rating} size={15} />
      </div>
      {!!review.comment && <p style={{ marginTop: 10, whiteSpace: 'pre-line' }}>{review.comment}</p>}
      {product && (
        <span className="sl-tag" style={{ marginTop: 10 }}>📦 {product.name}</span>
      )}
    </div>
  );
};

export default ReviewCard;
