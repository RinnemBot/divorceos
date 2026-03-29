import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare, ThumbsUp, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/services/auth';
import { v4 as uuidv4 } from 'uuid';

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

const REVIEWS_KEY = 'divorceos_reviews';
const USER_REVIEWS_KEY = 'divorceos_user_reviews';

// Paid subscription tiers that can leave reviews
const PAID_TIERS = ['basic', 'essential', 'plus', 'done-for-you'];

export function isPaidUser(user: User): boolean {
  return PAID_TIERS.includes(user.subscription);
}

export function hasUserReviewed(userId: string): boolean {
  const data = localStorage.getItem(USER_REVIEWS_KEY);
  if (!data) return false;
  
  try {
    const userReviews: string[] = JSON.parse(data);
    return userReviews.includes(userId);
  } catch {
    return false;
  }
}

export function getAllReviews(): Review[] {
  const data = localStorage.getItem(REVIEWS_KEY);
  if (!data) return [];
  
  try {
    const reviews: Review[] = JSON.parse(data);
    return reviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function getAverageRating(): { average: number; total: number } {
  const reviews = getAllReviews();
  if (reviews.length === 0) return { average: 0, total: 0 };
  
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    total: reviews.length
  };
}

export function submitReview(
  user: User,
  rating: number,
  content: string
): { success: boolean; error?: string } {
  if (!isPaidUser(user)) {
    return { 
      success: false, 
      error: 'Only paid subscribers can leave reviews. Please upgrade to share your experience.' 
    };
  }
  
  if (hasUserReviewed(user.id)) {
    return { 
      success: false, 
      error: 'You have already submitted a review. You can edit your existing review.' 
    };
  }
  
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Please select a rating between 1 and 5 stars' };
  }
  
  if (content.trim().length < 10) {
    return { success: false, error: 'Review must be at least 10 characters long' };
  }
  
  const newReview: Review = {
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    rating,
    content: content.trim(),
    subscriptionTier: user.subscription,
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
    verified: true
  };
  
  // Save review
  const reviews = getAllReviews();
  reviews.unshift(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  
  // Mark user as reviewed
  const userReviewsData = localStorage.getItem(USER_REVIEWS_KEY);
  let userReviews: string[] = [];
  
  if (userReviewsData) {
    try {
      userReviews = JSON.parse(userReviewsData);
    } catch {
      userReviews = [];
    }
  }
  
  userReviews.push(user.id);
  localStorage.setItem(USER_REVIEWS_KEY, JSON.stringify(userReviews));
  
  return { success: true };
}

export function updateReview(
  reviewId: string,
  userId: string,
  rating: number,
  content: string
): { success: boolean; error?: string } {
  const reviews = getAllReviews();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId && r.userId === userId);
  
  if (reviewIndex === -1) {
    return { success: false, error: 'Review not found' };
  }
  
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Please select a rating between 1 and 5 stars' };
  }
  
  if (content.trim().length < 10) {
    return { success: false, error: 'Review must be at least 10 characters long' };
  }
  
  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    rating,
    content: content.trim(),
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return { success: true };
}

export function markReviewHelpful(reviewId: string): void {
  const reviews = getAllReviews();
  const review = reviews.find(r => r.id === reviewId);
  
  if (review) {
    review.helpfulCount++;
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }
}

export function getUserReview(userId: string): Review | null {
  const reviews = getAllReviews();
  return reviews.find(r => r.userId === userId) || null;
}

interface ReviewSystemProps {
  user: User | null;
}

export function ReviewSystem({ user }: ReviewSystemProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState({ average: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  
  const isPaid = user ? isPaidUser(user) : false;
  const hasReviewed = user ? hasUserReviewed(user.id) : false;
  const userReview = user ? getUserReview(user.id) : null;
  
  useEffect(() => {
    setReviews(getAllReviews());
    setAverageRating(getAverageRating());
  }, []);
  
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
      result = updateReview(userReview.id, user.id, rating, reviewContent);
    } else {
      result = submitReview(user, rating, reviewContent);
    }
    
    if (result.success) {
      toast({
        title: userReview ? 'Review Updated!' : 'Review Submitted!',
        description: 'Thank you for sharing your experience.',
      });
      
      // Refresh reviews
      setReviews(getAllReviews());
      setAverageRating(getAverageRating());
      
      // Reset form
      setRating(0);
      setReviewContent('');
      setIsEditing(false);
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive'
      });
    }
    
    setIsSubmitting(false);
  };
  
  const handleHelpful = (reviewId: string) => {
    markReviewHelpful(reviewId);
    setReviews(getAllReviews());
    
    toast({
      title: 'Thanks!',
      description: 'Your feedback helps others.',
    });
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
                  ? 'fill-amber-400 text-amber-400'
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
                        className="h-full bg-amber-400 rounded-full transition-all"
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
                  ? 'Update your review of DivorceOS'
                  : 'Share your experience with DivorceOS'
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
                    placeholder="Share your experience with DivorceOS. How has it helped you? What did you like most?"
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
            See what our customers are saying about DivorceOS
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