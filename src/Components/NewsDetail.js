import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from '../api';
import axios from 'axios';

const modernStyles = {
  container: {
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: "40px 20px",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
    minHeight: "50vh",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "20px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontSize: "1em",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.3s ease, transform 0.2s ease",
    gap: "4px",
    flexShrink: 0,
    width: "fit-content",
  },
  backButtonHover: {
    backgroundColor: "#0056b3",
    transform: "translateY(-2px)",
  },
  image: {
    width: "100%",
    maxHeight: "30vh",
    objectFit: "contain",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    flexShrink: 0,
  },
  title: {
    fontSize: "2.2em",
    fontWeight: "700",
    color: "#212529",
    marginBottom: "10px",
    lineHeight: "1.2",
    flexShrink: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px 20px",
    fontSize: "0.85em",
    color: "#6c757d",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #e9ecef",
    flexShrink: 0,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  contentArea: {
    flexGrow: 1,
    fontSize: "1em",
    lineHeight: "1.6",
    color: "#343a40",
    whiteSpace: "pre-wrap",
    paddingBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  articleContentText: {
    // No changes needed here, content will flow naturally
  },
  readMoreLink: {
    display: "inline-block",
    marginTop: "15px",
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
    transition: "background-color 0.3s ease, transform 0.2s ease",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  readMoreLinkHover: {
    backgroundColor: "#218838",
    transform: "translateY(-2px)",
  },
  icon: {
    marginRight: "5px",
    color: "#007bff",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
    fontSize: "18px",
    color: "#666",
  },
  error: {
    color: "#dc3545",
    textAlign: "center",
    fontSize: "16px",
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: "5px",
    padding: "10px",
    marginBottom: "20px",
  },
};

function NewsDetail() {
  const { id } = useParams(); // This will be the encoded URL
  const location = useLocation();
  const navigate = useNavigate();
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading] = useState(!article);
  const [error, setError] = useState('');

  const [isHovered, setIsHovered] = useState(false);
  const [isLinkHovered, setIsLinkHovered] = useState(false);

  useEffect(() => {
    // Check authentication first
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      // Store the current URL to redirect back after login
      localStorage.setItem('redirect_after_login', location.pathname);
      navigate('/login');
      return;
    }

    // Scroll to the top of the window when the component mounts
    window.scrollTo(0, 0);

    // If article is not in state, fetch it using the URL
    if (!article && id) {
      fetchArticleByUrl(id, accessToken);
    }
  }, [id, article, navigate, location.pathname]);

  const fetchArticleByUrl = async (encodedUrl, accessToken) => {
    setLoading(true);
    setError('');

    try {
      // Decode the URL
      const decodedUrl = decodeURIComponent(encodedUrl);
      let fullUrl = decodedUrl;
      
      // Add protocol if missing
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `https://${fullUrl}`;
      }

      // Search for the article with multiple search terms to increase chances of finding it
      const searchTerms = ['latest news', 'breaking news', 'top stories', 'news today'];
      let foundArticle = null;

      for (const searchTerm of searchTerms) {
        try {
          const response = await axios.get(`${API_URL}news/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: searchTerm,
              pageSize: 100,
            },
          });

          // Find the article with matching URL
          foundArticle = response.data.articles.find(
            (art) => art.url === fullUrl || 
                    art.url === decodedUrl || 
                    art.url === `http://${decodedUrl}` || 
                    art.url === `https://${decodedUrl}`
          );

          if (foundArticle) {
            break;
          }
        } catch (searchError) {
          console.log(`Search failed for term: ${searchTerm}`);
          continue;
        }
      }

      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        // If not found in recent articles, try a more specific search
        // Extract domain and keywords from URL for better search
        const urlParts = fullUrl.split('/');
        const domain = urlParts[2];
        const pathParts = urlParts.slice(3).join(' ').replace(/[-_]/g, ' ');
        
        try {
          const response = await axios.get(`${API_URL}news/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: `${domain} ${pathParts}`,
              pageSize: 50,
            },
          });

          foundArticle = response.data.articles.find(
            (art) => art.url === fullUrl || 
                    art.url === decodedUrl || 
                    art.url === `http://${decodedUrl}` || 
                    art.url === `https://${decodedUrl}`
          );

          if (foundArticle) {
            setArticle(foundArticle);
          } else {
            setError('Article not found. The link may be outdated or the article may no longer be available in recent news.');
          }
        } catch (specificSearchError) {
          setError('Article not found. The link may be outdated or the article may no longer be available.');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.setItem('redirect_after_login', location.pathname);
        navigate('/login');
      } else {
        setError('Failed to fetch article. Please try again later.');
      }
      console.error('Article fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={modernStyles.container}>
        <div style={modernStyles.loading}>Loading article...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={modernStyles.container}>
        <div style={modernStyles.error}>{error}</div>
        <button
          onClick={() => navigate("/")}
          style={{
            ...modernStyles.backButton,
            ...(isHovered ? modernStyles.backButtonHover : {}),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          &larr; Go Back to News
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={modernStyles.container}>
        <p>No news article found. Please go back to the news list.</p>
        <button
          onClick={() => navigate("/")}
          style={{
            ...modernStyles.backButton,
            ...(isHovered ? modernStyles.backButtonHover : {}),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          &larr; Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={modernStyles.container}>
      <button
        onClick={() => navigate("/")}
        style={{
          ...modernStyles.backButton,
          ...(isHovered ? modernStyles.backButtonHover : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span style={modernStyles.icon}>&#x2190;</span> Back to News
      </button>

      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          style={modernStyles.image}
        />
      )}

      <h1 style={modernStyles.title}>{article.title}</h1>

      <div style={modernStyles.meta}>
        <p style={modernStyles.metaItem}>
          <span style={modernStyles.icon}>&#128100;</span>
          <strong>Author:</strong> {article.author || "Unknown Author"}
        </p>
        <p style={modernStyles.metaItem}>
          <span style={modernStyles.icon}>&#128197;</span>
          <strong>Published:</strong>{" "}
          {new Date(article.publishedAt).toLocaleString()}
        </p>
        <p style={modernStyles.metaItem}>
          <span style={modernStyles.icon}>&#128200;</span>
          <strong>Source:</strong> {article.source?.name || "Unknown Source"}
        </p>
      </div>

      <div style={modernStyles.contentArea}>
        <p style={modernStyles.articleContentText}>
          {article.content}
        </p>
        {article.url && (
          <p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...modernStyles.readMoreLink,
                ...(isLinkHovered ? modernStyles.readMoreLinkHover : {}),
              }}
              onMouseEnter={() => setIsLinkHovered(true)}
              onMouseLeave={() => setIsLinkHovered(false)}
            >
              Read the full article on the original site{" "}
              <span style={{ fontSize: "0.8em" }}>&#x2192;</span>
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default NewsDetail;