import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, User, Calendar, Lock, CheckCircle } from 'lucide-react';
import { authService, type User } from '@/services/auth';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
  plan: string;
  verified: boolean;
}

export function ReviewSystem() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<{ rating: number; text: string }>({
    rating: 0,
    text: '',
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Load reviews from localStorage
    const stored = localStorage.getItem('divorceos_reviews');
    if (stored) {
      setReviews(JSON.parse(stored));
    } else {
      // Seed with sample reviews
      const sampleReviews: Review[] = [
        {
          id: '1',
          userId: 'sample1',
          userName: 'Sarah M.',
          rating: 5,
          text: 'Maria helped me understand the divorce process so much better. The child support calculator was incredibly accurate and saved me hours of research.',
          date: '2026-03-15',
          plan: 'Essential',
          verified: true,
        },
        {
          id: '2',
          userId: 'sample2',
          userName: 'Michael R.',
          rating: 5,
          text: 'Worth every penny. The forms generation feature alone saved me $2,000 in attorney fees. Highly recommend for anyone going through divorce in California.',
          date: '2026-03-10',
          plan: 'Plus',
          verified: true,
        },
        {
          id: '3',
          userId: 'sample3',
          userName: 'Jennifer K.',
          rating: 4,
          text: 'Great tool for understanding my rights. The 24/7 chat was helpful during late nights when I had questions. Would love even more county-specific info.',
          date: '2026-03-05',
          plan: 'Basic',
          verified: true,
        },
      ];
      setReviews(sampleReviews);
      localStorage.setItem('divorceos_reviews', JSON.stringify(sampleReviews));
    }

    // Check if user already submitted a review
    if (user) {
      const hasReviewed = reviews.some((r) => r.userId === user.id);
      setSubmitted(hasReviewed);
    }
  }, [reviews]);

  const isPayingCustomer = (): boolean => {
    if (!currentUser) return false;
    // Check if user has a paid plan
    const plan = currentUser.plan?.toLowerCase() || '';
    return plan === 'basic' || plan === 'essential' || plan === 'plus' || plan === 'pro';
  };

  const handleSubmit = () => {
    if (!currentUser || !isPayingCustomer() || userReview.rating === 0) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email?.split('@')[0] || 'Anonymous',
      rating: userReview.rating,
      text: userReview.text,
      date: new Date().toISOString().split('T')[0],
      plan: currentUser.plan || 'Basic',
      verified: true,
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('divorceos_reviews', JSON.stringify(updatedReviews));
    setSubmitted(true);
    setShowForm(false);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const StarRating = ({ rating, interactive = false, size = 'md' }: { rating: number; interactive?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-8 w-8',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setUserReview((prev) => ({ ...prev, rating: star }))}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= (interactive && hoveredStar ? hoveredStar : rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Customer Reviews</CardTitle>
                <p className="text-sm text-gray-600">
                  See what paying customers are saying about DivorceOS
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-900">{averageRating}</p>
              <StarRating rating={parseFloat(averageRating)} size="sm" />
              <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Write Review Section */}
      {currentUser ? (
        isPayingCustomer() ? (
          submitted ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Thank you for your review!</p>
                    <p className="text-sm text-green-700">Your feedback helps others make informed decisions.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Your Rating
                  </label>
                  <StarRating rating={userReview.rating} interactive size="lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Your Review
                  </label>
                  <Textarea
                    value={userReview.text}
                    onChange={(e) => setUserReview((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Share your experience with DivorceOS..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={userReview.rating === 0}>
                    Submit Review
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-blue-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Share Your Experience</p>
                      <p className="text-sm text-gray-600">
                        Your feedback helps others navigating divorce in California
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    Write a Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reviews are for paying customers only.</span>{' '}
                  Upgrade to any paid plan to share your experience.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-600">
                <span className="font-medium">Sign in to write a review.</span> Only paying customers can submit reviews.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <Badge variant="secondary" className="text-xs">
                        {review.plan} Plan
                      </Badge>
                      {review.verified && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(review.date).toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
