import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaSearch } from "react-icons/fa";

function NewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // State to hold the *actual* query used for fetching, distinct from the input field
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [category, setCategory] = useState('general');
    const navigate = useNavigate();
    const { isAuthenticated, accessToken, logout } = useAuth();

    const fetchNews = useCallback(async (query, selectedCategory) => {
        setLoading(true);
        setError('');

        if (!isAuthenticated) {
            toast.error('Not authenticated. Please log in.');
            setLoading(false);
            navigate('/login');
            return;
        }

        console.log("NewsPage: fetchNews called. isAuthenticated:", isAuthenticated, "accessToken:", accessToken ? "Present" : "Missing");

        try {
            let searchTerm = query.trim();
            if (!searchTerm) {
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

            const response = await api.get('auth/news/', {
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
                toast.error('Session expired or unauthorized. Please log in again.');
                logout();
                navigate('/login');
            } else if (err.response?.data) {
                setError(err.response.data.detail || 'Failed to fetch news.');
                toast.error(err.response.data.detail || 'Failed to fetch news.');
            } else {
                setError('Failed to fetch news. Please try again later.');
                toast.error('Failed to fetch news. Please try again later.');
            }
            console.error('News fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [navigate, isAuthenticated, accessToken, logout]);

    // This useEffect handles initial load and changes to activeSearchQuery or category
    useEffect(() => {
        if (isAuthenticated) {
            fetchNews(activeSearchQuery, category);
        } else {
            navigate('/login');
        }
    }, [activeSearchQuery, category, isAuthenticated, navigate, fetchNews]); // Added fetchNews to dependencies

    const handleLogout = () => {
        logout();
        toast.info('You have been logged out.');
        navigate('/login');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Update activeSearchQuery when search button is pressed
        setActiveSearchQuery(searchQuery);
    };

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        // Category change should trigger news fetch with current active search query
        // activeSearchQuery will be used by the useEffect due to its dependency
    };

    const createNewsId = (newsUrl) => {
        if (!newsUrl) return '';
        const cleanUrl = newsUrl.replace(/^https?:\/\//, '');
        return encodeURIComponent(cleanUrl);
    };

    const LoadingSpinner = () => (
        <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading news...</p>
        </div>
    );

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.containernew}>
                    <header style={styles.header}>
                        <h1 style={styles.appTitle}>News Central</h1>
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
                                autoFocus
                            />
                            <button type="submit" style={styles.searchButton}><FaSearch /></button>
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
                        {activeSearchQuery ? `Search Results for "${activeSearchQuery}" in ${category.charAt(0).toUpperCase() + category.slice(1)}` : `${category.charAt(0).toUpperCase() + category.slice(1)} News`}
                    </h2>

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {error && <p style={styles.errorMessage}>{error}</p>}

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
                                                    e.target.style.display = 'none'; // Hide broken images
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
                                            to={`/news/${createNewsId(article.url)}`}
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
            </div>
        </div>
    );
}

const styles = {
    outerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden',
        overflowY: 'auto',
        backgroundColor: '#f0f2f5',
    },
    background: {
        width: '100%',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        color: "white",
        boxSizing: 'border-box',
        minHeight: '100vh',
        boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    },
    containernew: {
        width: "100%",
        maxWidth: "1200px",
        padding: "20px",
        textAlign: "center",
        flexGrow: 1,
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '15px',
        color: 'white',
        flexWrap: 'wrap',
        gap: '10px',
    },
    appTitle: {
        fontSize: '36px',
        color: 'white',
        margin: 0,
        fontWeight: '300',
        fontFamily: "Arial, sans-serif",
    },
    logoutButton: {
        backgroundColor: 'Red',
        color: 'rgba(251, 250, 252, 0.92)',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        gap: '20px',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 20px',
        borderRadius: '8px',
    },
    searchForm: {
        display: 'flex',
        gap: '10px',
        flexGrow: 1,
        minWidth: '200px',
        maxWidth: '100%',
    },
    searchInput: {
        flexGrow: 1,
        padding: '10px 15px',
        background: "rgba(255, 255, 255, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        borderRadius: '25px',
        fontSize: '16px',
        color: 'white',
        outline: 'none',
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
        '::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    searchButton: {
        backgroundColor: 'white',
        color: '#764ba2',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    categorySelect: {
        padding: '10px 15px',
        border: "1px solid rgba(255, 255, 255, 0.5)",
        borderRadius: '25px',
        fontSize: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        minWidth: '120px',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '20px',
        transition: 'border-color 0.3s ease',
        flexShrink: 0,
    },
    sectionHeading: {
        fontSize: '28px',
        color: 'white',
        marginBottom: '25px',
        textAlign: 'center',
        fontWeight: '300',
    },
    loaderContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        minHeight: '200px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
        color: 'white',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    loadingText: {
        textAlign: 'center',
        fontSize: '18px',
        color: 'white',
        margin: 0,
    },
    noResults: {
        textAlign: 'center',
        fontSize: '18px',
        color: 'white',
        gridColumn: '1 / -1',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        marginTop: '20px',
    },
    newsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '25px',
    },
    newsCard: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
    },
    newsImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginBottom: '15px',
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    newsTitle: {
        fontSize: '22px',
        marginBottom: '10px',
        color: '#333',
        lineHeight: '1.3',
        fontWeight: '500',
    },
    newsDescription: {
        fontSize: '15px',
        color: '#555',
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
        borderTop: '1px solid #eee',
        paddingTop: '10px',
        marginTop: '10px',
    },
    newsTime: {
        fontStyle: 'italic',
        color: '#777',
    },
    newsAuthor: {
        fontWeight: 'bold',
        color: '#777',
    },
    readMore: {
        display: 'inline-block',
        backgroundColor: '#667eea',
        color: 'white',
        padding: '10px 18px',
        borderRadius: '25px',
        textDecoration: 'none',
        fontSize: '15px',
        marginTop: '10px',
        alignSelf: 'flex-start',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    errorMessage: {
        color: 'white',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        border: '1px solid rgba(255, 107, 107, 0.5)',
        borderRadius: '8px',
        padding: '15px',
        fontSize: '16px',
        textAlign: 'center',
        marginBottom: '20px',
        fontWeight: 'normal',
    },
};

const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Base styles for option elements */
select option {
    background: #764ba2; /* Darker background for options */
    color: white;
}

/* Global reset/base for better responsiveness */
body {
    margin: 0;
    padding: 0;
    box-sizing: border-box; /* Crucial for responsive layouts */
}
*, *::before, *::after {
    box-sizing: inherit; /* Inherit box-sizing */
}

/* Media Queries for Responsiveness */

/* Extra large screens (optional, if you want specific large-screen behavior) */
@media (min-width: 1400px) {
    .containernew {
        padding: 30px;
    }
    .appTitle {
        font-size: 40px;
    }
    .newsGrid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 30px;
    }
}

/* Large screens (desktops) */
@media (min-width: 992px) and (max-width: 1399px) {
    .container {
        padding: 25px;
    }
    .appTitle {
        font-size: 38px;
    }
    .newsGrid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
    }
}

/* Medium screens (tablets, smaller laptops) */
@media (min-width: 769px) and (max-width: 991px) {
    .container {
        padding: 15px;
    }
    .appTitle {
        font-size: 32px;
    }
    .newsGrid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
    }
    .newsTitle {
        font-size: 20px;
    }
    .newsDescription {
        font-size: 14px;
    }
}

/* Small screens (tablets in portrait, large phones) */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }

    .header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .appTitle {
        font-size: 30px;
        margin-bottom: 15px;
    }
    .logoutButton {
        width: 100%;
        max-width: 200px;
    }
    .controls {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
        padding: 10px;
    }
    .searchForm {
        flex-direction: column;
        gap: 10px;
        width: 100%;
    }
    .searchInput {
        width: 100%;
    }
    .searchButton {
        width: 100%;
    }
    .categorySelect {
        width: 100%;
    }
    .sectionHeading {
        font-size: 24px;
        margin-bottom: 20px;
    }
    .newsGrid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
    }
    .newsTitle {
        font-size: 20px;
    }
    .newsDescription {
        font-size: 14px;
    }
}

/* Extra small screens (mobile phones) */
@media (max-width: 480px) {
    .container {
        padding: 5px;
    }
    .appTitle {
        font-size: 26px;
    }
    .logoutButton {
        padding: 8px 15px;
        font-size: 14px;
    }
    .searchInput, .searchButton, .categorySelect {
        padding: 8px 12px;
        font-size: 14px;
    }
    .sectionHeading {
        font-size: 20px;
        margin-bottom: 15px;
    }
    .newsGrid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    .newsImage {
        height: 180px;
    }
    .newsTitle {
        font-size: 18px;
    }
    .newsDescription {
        font-size: 13px;
    }
    .readMore {
        padding: 8px 15px;
        font-size: 14px;
    }
}

/* Very tiny screens (e.g., iPhone 5/SE size or smaller) */
@media (max-width: 375px) {
    .appTitle {
        font-size: 22px;
    }
    .logoutButton {
        padding: 6px 12px;
        font-size: 12px;
    }
    .searchInput, .searchButton, .categorySelect {
        padding: 6px 10px;
        font-size: 12px;
    }
    .sectionHeading {
        font-size: 18px;
    }
    .newsImage {
        height: 150px;
    }
    .newsTitle {
        font-size: 16px;
    }
    .newsDescription {
        font-size: 12px;
    }
    .readMore {
        padding: 6px 12px;
        font-size: 12px;
    }
}
`;
document.head.appendChild(styleSheet);

export default NewsPage;