import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../api';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; 

function HomePage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('general');
  const navigate = useNavigate();

  const fetchNews = useCallback(async (query = '', selectedCategory = category) => {
    setLoading(true);
    setError('');
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      let searchTerm = '';
      if (query.trim()) {
        searchTerm = query.trim();
      } else {
        const categoryQueries = {
          general: 'latest news',
          business: 'business news',
          technology: 'technology news',
          entertainment: 'entertainment news',
          health: 'health news',
          science: 'science news',
          sports: 'sports news',
        };
        searchTerm = categoryQueries[selectedCategory] || 'latest news';
      }

      const response = await axios.get(`${API_URL}news/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: searchTerm,
          pageSize: 20,
        },
      });
      setNews(response.data.articles);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      } else if (err.response?.data) {
        setError(err.response.data.detail || 'Failed to fetch news.');
      } else {
        setError('Failed to fetch news. Please try again later.');
      }
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate, category]);

  useEffect(() => {
    fetchNews();
  }, [category, fetchNews]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews(searchQuery, category);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    setSearchQuery('');
    fetchNews('', newCategory);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchNews('', category);
  };

  const LoadingSpinner = () => (
    <div style={styles.loaderContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading news...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.appTitle}>News App</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </header>

      <div style={styles.controls}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>Search</button>
          {searchQuery && (
            <button type="button" onClick={clearSearch} style={styles.clearButton}>
              Clear
            </button>
          )}
        </form>

        <select
          value={category}
          onChange={handleCategoryChange}
          style={styles.categorySelect}
        >
          <option value="general">General</option>
          <option value="business">Business</option>
          <option value="technology">Technology</option>
          <option value="entertainment">Entertainment</option>
          <option value="health">Health</option>
          <option value="science">Science</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      <h2 style={styles.sectionHeading}>
        {searchQuery ? `Search Results for "${searchQuery}"` : `${category.charAt(0).toUpperCase() + category.slice(1)} News`}
      </h2>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.newsGrid}>
            {!error && news.length === 0 && (
              <p style={styles.noResults}>No news found for your query.</p>
            )}
            {news.map((article, index) => (
              <div key={index} style={styles.newsCard}>
                {article.urlToImage && (
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    style={styles.newsImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h3 style={styles.newsTitle}>{article.title}</h3>
                <p style={styles.newsDescription}>{article.description}</p>
                <div style={styles.newsMeta}>
                  <span style={styles.newsTime}>
                    {new Date(article.publishedAt).toLocaleString()}
                  </span>
                  <span style={styles.newsAuthor}>
                    {article.author || 'Unknown Author'}
                  </span>
                </div>
                <Link
                  to={`/news/${encodeURIComponent(article.title.substring(0, 50))}-${index}`} 
                  state={{ article: article }} 
                  style={styles.readMore}
                >
                  Read More
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '15px',
  },
  appTitle: {
    fontSize: '36px',
    color: '#333',
    margin: 0,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '20px',
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    flexGrow: 1,
    minWidth: '300px',
  },
  searchInput: {
    flexGrow: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
  },
  searchButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  clearButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  categorySelect: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
    backgroundColor: '#fff',
    minWidth: '150px',
  },
  sectionHeading: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '25px',
    textAlign: 'center',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    minHeight: '200px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    margin: 0,
  },
  noResults: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    gridColumn: '1 / -1',
  },
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
  },
  newsCard: {
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  newsImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  newsTitle: {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#333',
    lineHeight: '1.3',
  },
  newsDescription: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '15px',
    flexGrow: 1,
  },
  newsMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#888',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  newsTime: {
    fontStyle: 'italic',
  },
  newsAuthor: {
    fontWeight: 'bold',
  },
  readMore: {
    display: 'inline-block',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '14px',
    marginTop: '10px',
    alignSelf: 'flex-start',
    transition: 'background-color 0.3s ease',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '16px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    padding: '10px',
  },
};

const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default HomePage;