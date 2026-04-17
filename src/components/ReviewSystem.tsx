import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare, ThumbsUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { type User } from '@/services/auth';

export interface Review {
  id: string;
  userId: string;
  userName?: string;
  userEmail: string;
  rating: number;
  content: string;
  subscriptionTier: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt?: string;
  verified: boolean;
}

// Paid subscription tiers that can leave reviews
const PAID_TIERS = ['basic', 'essential', 'plus', 'done-for-you'];

export function isPaidUser(user: User): boolean {
  return PAID_TIERS.includes(user.subscription);
}

async function fetchReviewsSnapshot(userId?: string): Promise<{
  reviews: Review[];
  averageRating: { average: number; total: number };
  userReview: Review | null;
}> {
  const response = await fetch('/api/reviews');
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load reviews');
  }

  const reviews: Review[] = Array.isArray(payload.reviews) ? payload.reviews : [];
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = reviews.length
    ? { average: Math.round((sum / reviews.length) * 10) / 10, total: reviews.length }
    : { average: 0, total: 0 };

  return {
    reviews,
    averageRating,
    userReview: userId ? reviews.find((review) => review.userId === userId) || null : null,
  };
}

async function submitReview(user: User, rating: number, content: string) {
  if (!isPaidUser(user)) {
    return {
      success: false,
      error: 'Only paid subscribers can leave reviews. Please upgrade to share your experience.',
    };
  }

  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { success: false, error: payload.error || 'Unable to submit review' };
  }

  return { success: true, review: payload.review as Review };
}

async function updateReview(reviewId: string, rating: number, content: string) {
  const response = await fetch('/api/reviews', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId, rating, content }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { success: false, error: payload.error || 'Unable to update review' };
  }

  return { success: true, review: payload.review as Review };
}

async function markReviewHelpful(reviewId: string) {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'helpful', reviewId }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update review');
  }

  return payload.review as Review;
}

interface ReviewSystemProps {
  user: User | null;
}

export function ReviewSystem({ user }: ReviewSystemProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState({ average: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  
  const isPaid = user ? isPaidUser(user) : false;
  
  useEffect(() => {
    let cancelled = false;

    void fetchReviewsSnapshot(user?.id)
      .then((snapshot) => {
        if (cancelled) return;
        setReviews(snapshot.reviews);
        setAverageRating(snapshot.averageRating);
        setUserReview(snapshot.userReview);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load reviews', error);
        setReviews([]);
        setAverageRating({ average: 0, total: 0 });
        setUserReview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  
  // Load user's existing review if editing
  useEffect(() => {
    if (userReview && isEditing) {
      setRating(userReview.rating);
      setReviewContent(userReview.content);
    }
  }, [userReview, isEditing]);
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    let result;
    if (userReview) {
      result = await updateReview(userReview.id, rating, reviewContent);
    } else {
      result = await submitReview(user, rating, reviewContent);
    }
    
    if (result.success) {
      toast.success(userReview ? 'Review Updated!' : 'Review Submitted!', {
        description: 'Thank you for sharing your experience.',
      });
      
      const snapshot = await fetchReviewsSnapshot(user.id);
      setReviews(snapshot.reviews);
      setAverageRating(snapshot.averageRating);
      setUserReview(snapshot.userReview);
      
      // Reset form
      setRating(0);
      setReviewContent('');
      setIsEditing(false);
    } else {
      toast.error('Error', {
        description: result.error,
      });
    }
    
    setIsSubmitting(false);
  };
  
  const handleHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      const snapshot = await fetchReviewsSnapshot(user?.id);
      setReviews(snapshot.reviews);
      setAverageRating(snapshot.averageRating);
      setUserReview(snapshot.userReview);

      toast.success('Thanks!', {
        description: 'Your feedback helps others.',
      });
    } catch (error) {
      toast.error('Unable to update review', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };
  
  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (interactive ? (hoverRating || rating) : count)
                  ? 'fill-emerald-400 text-emerald-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };
  
  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[5 - r.rating]++;
      }
    });
    return distribution;
  };
  
  const ratingDistribution = getRatingDistribution();
  
  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-slate-900">
                {averageRating.average > 0 ? averageRating.average : '-'}
              </div>
              <div className="flex justify-center my-2">
                {renderStars(Math.round(averageRating.average))}
              </div>
              <p className="text-sm text-slate-500">
                {averageRating.total} {averageRating.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            <div className="flex-1 w-full max-w-md">
              {[5, 4, 3, 2, 1].map((stars, index) => {
                const count = ratingDistribution[index];
                const percentage = averageRating.total > 0 
                  ? Math.round((count / averageRating.total) * 100) 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-600 w-3">{stars}</span>
                    <Star className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Write a Review Section */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {userReview ? 'Your Review' : 'Write a Review'}
            </CardTitle>
            <CardDescription>
              {isPaid 
                ? userReview 
                  ? 'Update your review of Divorce Agent'
                  : 'Share your experience with Divorce Agent'
                : 'Only paid subscribers can leave reviews. Please upgrade to Basic or higher.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isPaid ? (
              <div className="text-center py-6 text-slate-500">
                <Star className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="mb-2">Upgrade to leave a review</p>
                <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
                  View Pricing Plans
                </Button>
              </div>
            ) : userReview && !isEditing ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userReview.userName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(userReview.rating)}
                      <Badge variant="secondary" className="text-xs">
                        {userReview.subscriptionTier}
                      </Badge>
                    </div>
                    <p className="text-slate-700 mb-2">{userReview.content}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{new Date(userReview.createdAt).toLocaleDateString()}</span>
                      {userReview.updatedAt && (
                        <span className="text-xs">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Review
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Your Rating
                  </label>
                  {renderStars(rating, true)}
                  {rating > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      {rating === 5 && 'Excellent!'}
                      {rating === 4 && 'Very Good'}
                      {rating === 3 && 'Good'}
                      {rating === 2 && 'Fair'}
                      {rating === 1 && 'Poor'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Your Review
                  </label>
                  <Textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience with Divorce Agent. How has it helped you? What did you like most?"
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum 10 characters ({reviewContent.length} / 10)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={rating === 0 || reviewContent.length < 10 || isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Submitting...' 
                      : userReview ? 'Update Review' : 'Submit Review'
                    }
                  </Button>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setRating(0);
                        setReviewContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            See what our customers are saying about Divorce Agent
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {review.userName?.charAt(0) || review.userEmail.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {review.userName || review.userEmail.split('@')[0]}
                        </span>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Verified Customer
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {review.subscriptionTier}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 mb-3">{review.content}</p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-slate-500 hover:text-slate-700"
                          onClick={() => handleHelpful(review.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful ({review.helpfulCount})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}