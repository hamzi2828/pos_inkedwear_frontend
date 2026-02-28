"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.css";
import Image from "next/image";
import { blogsService, FeaturedBlog } from "../services/blogsService";

const BlogsSection: React.FC = () => {
  const [blogs, setBlogs] = useState<FeaturedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured blogs
  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const featuredBlogs = await blogsService.getFeaturedBlogs();
        setBlogs(featuredBlogs);
      } catch (err) {
        console.error('Failed to fetch featured blogs:', err);
        setError('Failed to load blogs');
        // Service already provides fallback, so we should still have data
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to get absolute image URL
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath || imagePath.trim() === '') return '/images/hero.svg'; // fallback image
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  return (
    <>
      <section
        id="blogs"
        className="section7-team-member py-16 md:py-20 px-4 md:px-8 lg:px-20 relative overflow-hidden"
      >
        <div className="section7-context">
          <div className="section7-header">
            <Link href="/blogs" className="section7-badge">
              <div className="section7-icon"></div>
              <div className="section7-text">Fitness Tips</div>
            </Link>
            <Link href="/blogs" className="section7-read-for-been-update">
              Stay Fit Stay Strong
            </Link>
          </div>
        </div>

        <div className="section7-container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <span className="text-gray-600">Loading latest blogs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-500 mb-2">Error loading blogs</div>
              <div className="text-gray-500 text-sm">{error}</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-500">No blogs available</div>
            </div>
          ) : (
            <div className="section7-content">
              {blogs.map((blog, index) => (
                <div key={blog._id} className={index === 0 ? "section7-blog-post-card" : "section7-blog-post-card2"}>
                  <Link href={`/blogs-detail/${blog.slug || blog._id}`} className="flex flex-col h-full">
                    <div className="section7-content2">
                      <div className="section7-heading-and-subheading">
                        <div className="section7-heading-and-text">
                          <div className="section7-heading-and-icon">
                            <div className="section7-heading">
                              {truncateText(blog.title, 40)}
                            </div>
                            <div className="section7-icon-wrap">
                              <i className="fas fa-up-right-from-square section7-arrow-up-right"></i>
                            </div>
                          </div>
                          <div className="section7-supporting-text">
                            {blog.excerpt || blog.content 
                              ? truncateText((blog.excerpt || blog.content || '').replace(/<[^>]*>/g, ''), 120) // Strip HTML tags and truncate
                              : 'Read more about this fitness topic...'
                            }
                          </div>
                          {blog.category && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {blog.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Image
                      className={index === 0 ? "section7-image" : "section7-image2"}
                      src={getImageUrl(blog.image || blog.thumbnail)}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index === 0}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default BlogsSection;