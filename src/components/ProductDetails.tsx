import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Heart, Star, Trash2 } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const p = await api.getProduct(id);
        setProduct(p);

        const r = await api.getReviews(id);
        setReviews(r);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const isInWishlist = profile?.wishlist?.includes(id || '') || false;

  const handleToggleWishlist = async () => {
    if (!user || !profile || !id) {
      alert("Please sign in to manage wishlist");
      return;
    }
    try {
      const newWishlist = isInWishlist 
        ? profile.wishlist.filter(wId => wId !== id)
        : [...(profile.wishlist || []), id];
      
      await api.updateWishlist(newWishlist);
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmittingReview(true);
    try {
      const newReview = await api.addReview({
        productId: id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews([newReview, ...reviews]);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-96 bg-slate-200 rounded-2xl w-full"></div>
    </div>;
  }

  if (!product) {
    return <div className="text-center py-20 text-slate-500">Product not found.</div>;
  }

  const averageRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="bg-slate-100 rounded-2xl overflow-hidden aspect-[3/4] relative">
        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
      </div>
      
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">{product.category}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-2xl font-medium text-slate-900">{formatCurrency(product.price, product.currency)}</span>
            <div className="flex items-center space-x-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-slate-600 font-medium">{averageRating} ({reviews.length} reviews)</span>
            </div>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
          {product.description}
        </p>

        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Availability</span>
            <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
            </span>
          </div>

          <div className="flex space-x-4">
            <button
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add to Cart
            </button>
            <button 
              onClick={handleToggleWishlist}
              className={`p-4 rounded-full border border-slate-200 transition-colors ${isInWishlist ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-600 hover:text-black hover:border-slate-300'}`}
            >
              <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pt-12 border-t border-slate-200">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Customer Reviews</h2>
          
          {user ? (
            <form onSubmit={handleAddReview} className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Write a Review</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                <select 
                  value={reviewRating} 
                  onChange={e => setReviewRating(Number(e.target.value))}
                  className="w-full sm:w-32 rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm focus:border-black focus:ring-black"
                >
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="block w-full rounded-lg border-slate-200 py-2 px-3 text-sm focus:border-black focus:ring-black"
                  placeholder="Share your thoughts..."
                />
              </div>
              <button 
                type="submit" 
                disabled={submittingReview}
                className="bg-black text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex justify-between items-center text-sm text-slate-600">
              <span>Sign in to write a review.</span>
            </div>
          )}

          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{review.userName}</p>
                    <div className="flex items-center mt-1 text-yellow-500 space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {(profile?.role === 'admin' || user?.uid === review.userId) && (
                    <button onClick={() => handleDeleteReview(review.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-slate-500 text-sm">No reviews yet.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
