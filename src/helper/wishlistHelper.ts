import { toast } from './toastHelper';
import { isAuthenticated, getCurrentUser, getAuthToken } from './helper';

export interface WishlistItem {
  productId: string;
  productName: string;
  price: number;
  discountedPrice?: number;
  thumbnailUrl?: string;
  category?: string;
  addedAt?: string;
}

export interface AddToWishlistParams {
  productId: string;
  productName: string;
  price: number;
  discountedPrice?: number;
  thumbnailUrl?: string;
  category?: string;
}

class WishlistHelper {
  private static instance: WishlistHelper;

  public static getInstance(): WishlistHelper {
    if (!WishlistHelper.instance) {
      WishlistHelper.instance = new WishlistHelper();
    }
    return WishlistHelper.instance;
  }

  // Check if user is logged in
  private isUserLoggedIn(): boolean {
    if (typeof window === 'undefined') {
      console.log('🌍 Window undefined - SSR context');
      return false;
    }
    
    const authenticated = isAuthenticated();
    console.log('❤️ User authenticated (wishlist):', authenticated);
    
    return authenticated;
  }

  // Get user ID from token
  private getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const user = getCurrentUser();
      console.log('👤 Current user (wishlist):', user);
      
      if (user && user.id) {
        return user.id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user ID for wishlist:', error);
      return null;
    }
  }

  // Add item to wishlist in database
  private async addToWishlistDatabase(userId: string, item: WishlistItem): Promise<boolean | string> {
    try {
      const token = getAuthToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wishlist`;
      
      console.log('❤️ Adding to wishlist database:');
      console.log('- API URL:', apiUrl);
      console.log('- User ID:', userId);
      console.log('- Product ID:', item.productId);
      console.log('- Has token:', !!token);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
        }),
      });

      console.log('- Response status:', response.status);
      console.log('- Response ok:', response.ok);
      
      let responseData;
      try {
        responseData = await response.text();
        console.log('- Response data (text):', responseData);
        
        // Try to parse as JSON if possible
        try {
          const jsonData = JSON.parse(responseData);
          console.log('- Response data (parsed JSON):', jsonData);
        } catch  {
          console.log('- Response data is not valid JSON');
        }
      } catch (textError) {
        console.error('- Error reading response text:', textError);
        responseData = 'Error reading response';
      }

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, responseData);
        
        // Try to parse error message from response
        let errorMessage = `Failed to add to wishlist: ${response.status}`;
        let isAlreadyInWishlist = false;
        
        try {
          const errorData = JSON.parse(responseData);
          if (errorData.message) {
            errorMessage = errorData.message;
            // Check if it's already in wishlist case
            if (errorData.message.toLowerCase().includes('already in wishlist')) {
              isAlreadyInWishlist = true;
            }
          }
        } catch {
          // If parsing fails, use the raw response
          if (responseData && responseData.length > 0) {
            errorMessage = responseData;
          }
        }
        
        // For "already in wishlist", return a special status
        if (isAlreadyInWishlist) {
          console.log('ℹ️ Product already in wishlist');
          return 'already_in_wishlist'; // Special return value
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Wishlist API call successful');
      return true;
    } catch (error) {
      console.error('❌ Error adding to wishlist in database:', error);
      console.error('❌ Error details:', {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
        name: (error as Error)?.name
      });
      return false;
    }
  }

  // Remove item from wishlist in database
  private async removeFromWishlistDatabase(userId: string, productId: string): Promise<boolean> {
    try {
      const token = getAuthToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wishlist/${productId}`;
      
      console.log('💔 Removing from wishlist database:');
      console.log('- API URL:', apiUrl);
      console.log('- User ID:', userId);
      console.log('- Product ID:', productId);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('- Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to remove from wishlist: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error removing from wishlist in database:', error);
      return false;
    }
  }

  // Add/remove item to/from local storage wishlist (fallback)
  private toggleWishlistLocalStorage(item: WishlistItem): boolean {
    try {
      const existingWishlist = this.getLocalWishlist();
      const existingItemIndex = existingWishlist.findIndex(
        (wishlistItem) => wishlistItem.productId === item.productId
      );

      let isAdded = true;
      if (existingItemIndex >= 0) {
        // Remove item if it exists
        existingWishlist.splice(existingItemIndex, 1);
        isAdded = false;
      } else {
        // Add new item
        existingWishlist.push({
          ...item,
          addedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('wishlist', JSON.stringify(existingWishlist));
      return isAdded;
    } catch (error) {
      console.error('Error updating local wishlist:', error);
      return false;
    }
  }

  // Get wishlist from local storage
  private getLocalWishlist(): WishlistItem[] {
    try {
      const wishlist = localStorage.getItem('wishlist');
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      console.error('Error getting local wishlist:', error);
      return [];
    }
  }

  // Check if item is in local wishlist
  private isInLocalWishlist(productId: string): boolean {
    try {
      const wishlist = this.getLocalWishlist();
      return wishlist.some(item => item.productId === productId);
    } catch (error) {
      console.error('Error checking local wishlist:', error);
      return false;
    }
  }

  // Main toggle wishlist function
  public async toggleWishlist(params: AddToWishlistParams): Promise<boolean> {
    console.log('❤️ Toggling wishlist with params:', params);
    
    const {
      productId,
      productName,
      price,
      discountedPrice,
      thumbnailUrl,
      category
    } = params;

    // Check if user is logged in
    if (!this.isUserLoggedIn()) {
      toast.error('Please login to add products to wishlist', {
        duration: 4000,
        position: 'top-center',
      });
      return false;
    }

    const userId = this.getUserId();
    if (!userId) {
      toast.error('User authentication error. Please login again.', {
        duration: 4000,
        position: 'top-center',
      });
      return false;
    }

    const wishlistItem: WishlistItem = {
      productId,
      productName,
      price,
      discountedPrice,
      thumbnailUrl,
      category,
    };

    try {
      // Check if item is currently in local wishlist to determine action
      const isCurrentlyInWishlist = this.isInLocalWishlist(productId);
      
      // Show loading toast
      const loadingToast = toast.loading(
        isCurrentlyInWishlist ? 'Removing from wishlist...' : 'Adding to wishlist...'
      );

      let success: boolean;
      let isAdded: boolean;

      if (isCurrentlyInWishlist) {
        // Remove from wishlist
        success = await this.removeFromWishlistDatabase(userId, productId);
        isAdded = false;
      } else {
        // Add to wishlist
        const addResult = await this.addToWishlistDatabase(userId, wishlistItem);
        isAdded = true;
        
        // Handle special case where product is already in wishlist
        if (addResult === 'already_in_wishlist') {
          loadingToast.dismiss();
          toast.success(`${productName} is already in your wishlist!`, {
            duration: 3000,
            position: 'top-center',
          });
          
          // Trigger wishlist update event to ensure UI is in sync
          window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
            detail: { productId, isAdded: true, item: wishlistItem }
          }));
          
          return true; // Already in wishlist, but treated as success
        }
        
        success = addResult === true;
      }

      loadingToast.dismiss();

      if (success) {
        // Update local storage to match database
        this.toggleWishlistLocalStorage(wishlistItem);
        
        toast.success(
          isAdded 
            ? `${productName} added to wishlist!` 
            : `${productName} removed from wishlist!`,
          {
            duration: 3000,
            position: 'top-center',
          }
        );

        // Trigger wishlist update event for UI components
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
          detail: { productId, isAdded, item: wishlistItem }
        }));

        return isAdded;
      } else {
        // Fallback to local storage
        const localIsAdded = this.toggleWishlistLocalStorage(wishlistItem);
        toast.success(
          localIsAdded 
            ? `${productName} added to wishlist! (Saved locally)`
            : `${productName} removed from wishlist! (Saved locally)`,
          {
            duration: 3000,
            position: 'top-center',
          }
        );

        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
          detail: { productId, isAdded: localIsAdded, item: wishlistItem }
        }));

        return localIsAdded;
      }
    } catch (error) {
      toast.error('Failed to update wishlist. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
      console.error('Toggle wishlist error:', error);
      return false;
    }
  }

  // Check if item is in wishlist
  public isInWishlist(productId: string): boolean {
    return this.isInLocalWishlist(productId);
  }

  // Get wishlist items count
  public getWishlistItemsCount(): number {
    try {
      const wishlist = this.getLocalWishlist();
      return wishlist.length;
    } catch (error) {
      console.error('Error getting wishlist items count:', error);
      return 0;
    }
  }

  // Clear wishlist
  public clearWishlist(): void {
    try {
      localStorage.removeItem('wishlist');
      window.dispatchEvent(new CustomEvent('wishlistCleared'));
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }
  }
}

// Export singleton instance
export const wishlistHelper = WishlistHelper.getInstance();

// Convenience function for easy import
export const toggleWishlist = (params: AddToWishlistParams) => wishlistHelper.toggleWishlist(params);
export const isInWishlist = (productId: string) => wishlistHelper.isInWishlist(productId);