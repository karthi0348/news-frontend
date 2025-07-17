import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from '../api/axiosConfig'; 
import { useAuth } from '../context/AuthContext'; 
import { toast } from 'react-toastify'; 

function NewsDetail() {
    const { id } = useParams(); 
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, accessToken, logout } = useAuth(); 
    const [article, setArticle] = useState(location.state?.article || null);
    const [loading, setLoading] = useState(!article);
    const [error, setError] = useState('');

    const [isHoveredBack, setIsHoveredBack] = useState(false); 
    const [isHoveredReadMore, setIsHoveredReadMore] = useState(false); 

    const fetchArticleByUrl = useCallback(async (encodedUrl) => {
        setLoading(true);
        setError('');

        if (!accessToken) {
            toast.error('Authentication token missing. Please log in.');
            setLoading(false);
            logout();
            navigate('/login');
            return;
        }

        try {
            const decodedUrl = decodeURIComponent(encodedUrl);
            let fullUrl = decodedUrl;

            if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
                fullUrl = `https://${fullUrl}`;
            }

            const searchTerms = ['latest news', 'breaking news', 'top stories', 'news today'];
            let foundArticle = null;

            for (const searchTerm of searchTerms) {
                try {
                    const response = await api.get('auth/news/', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        params: {
                            q: searchTerm,
                            pageSize: 100,
                        },
                    });

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
                    console.log(`Search failed for term: ${searchTerm}. Trying next...`);
                }
            }

            if (foundArticle) {
                setArticle(foundArticle);
            } else {
                const urlParts = fullUrl.split('/');
                const domain = urlParts[2];
                const pathParts = urlParts.slice(3).join(' ').replace(/[-_]/g, ' ');

                try {
                    const response = await api.get('auth/news/', {
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
                        toast.error('Article not found or link outdated.');
                    }
                } catch (specificSearchError) {
                    console.error('Specific search failed:', specificSearchError);
                    setError('Article not found. The link may be outdated or the article may no longer be available.');
                    toast.error('Failed to find article.');
                }
            }
        } catch (err) {
            if (err.response?.status === 401) {
                console.error("401 Unauthorized in NewsDetail, logging out.", err);
                logout();
                localStorage.setItem('redirect_after_login', location.pathname);
                navigate('/login');
            } else {
                setError('Failed to fetch article. Please try again later.');
                toast.error('Failed to fetch article.');
                console.error('Article fetch error:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [accessToken, logout, navigate, location.pathname]);
    useEffect(() => {
        window.scrollTo(0, 0);

        if (!isAuthenticated) {
            localStorage.setItem('redirect_after_login', location.pathname);
            navigate('/login');
            return;
        }

        if (!article && id && isAuthenticated) {
            fetchArticleByUrl(id);
        }
    }, [id, article, navigate, location.pathname, isAuthenticated, fetchArticleByUrl]); 

    const commonContainerStyle = {
        ...styles.outerContainer,
        minHeight: '100vh', 
        alignItems: 'center', 
        padding: '20px 0', 
    };

    if (loading) {
        return (
            <div style={commonContainerStyle}>
                <div style={styles.background}>
                    <div style={styles.container}>
                        <div style={styles.loading}>Loading article...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={commonContainerStyle}>
                <div style={styles.background}>
                    <div style={styles.container}>
                        <div style={styles.errorMessage}>{error}</div>
                        <button
                            onClick={() => navigate("/news")}
                            style={{
                                ...styles.button,
                                ...(isHoveredBack ? styles.buttonHover : {}),
                                marginTop: '20px', 
                            }}
                            onMouseEnter={() => setIsHoveredBack(true)}
                            onMouseLeave={() => setIsHoveredBack(false)}
                        >
                            &larr; Go Back to News
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div style={commonContainerStyle}>
                <div style={styles.background}>
                    <div style={styles.container}>
                        <p style={styles.noArticleMessage}>No news article found. Please go back to the news list.</p>
                        <button
                            onClick={() => navigate("/news")}
                            style={{
                                ...styles.button,
                                ...(isHoveredBack ? styles.buttonHover : {}),
                                marginTop: '20px',
                            }}
                            onMouseEnter={() => setIsHoveredBack(true)}
                            onMouseLeave={() => setIsHoveredBack(false)}
                        >
                            &larr; Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.outerContainer}>
            <div style={styles.background}>
                <div style={styles.container}>
                    <button
                        onClick={() => navigate("/news")}
                        style={{
                            ...styles.button,
                            ...(isHoveredBack ? styles.buttonHover : {}),
                        }}
                        onMouseEnter={() => setIsHoveredBack(true)}
                        onMouseLeave={() => setIsHoveredBack(false)}
                    >
                        <span style={styles.buttonIcon}>&#x2190;</span> Back to News
                    </button>

                    {article.urlToImage && (
                        <img
                            src={article.urlToImage}
                            alt={article.title}
                            style={styles.image}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}

                    <h1 style={styles.title}>{article.title}</h1>

                    <div style={styles.meta}>
                        <p style={styles.metaItem}>
                            <span style={styles.icon}>&#128100;</span>
                            <strong>Author:</strong> {article.author || "Unknown Author"}
                        </p>
                        <p style={styles.metaItem}>
                            <span style={styles.icon}>&#128197;</span>
                            <strong>Published:</strong>{" "}
                            {new Date(article.publishedAt).toLocaleString()}
                        </p>
                        <p style={styles.metaItem}>
                            <span style={styles.icon}>&#128200;</span>
                            <strong>Source:</strong> {article.source?.name || "Unknown Source"}
                        </p>
                    </div>

                    <div style={styles.contentArea}>
                        <p style={styles.articleContentText}>
                            {article.content}
                        </p>
                        {article.url && (
                            <p style={{ marginTop: '20px' }}> 
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        ...styles.readMoreLink,
                                        ...(isHoveredReadMore ? styles.readMoreLinkHover : {}),
                                    }}
                                    onMouseEnter={() => setIsHoveredReadMore(true)}
                                    onMouseLeave={() => setIsHoveredReadMore(false)}
                                >
                                    Read the full article on the original site{" "}
                                    <span style={{ fontSize: "0.8em" }}>&#x2192;</span>
                                </a>
                            </p>
                        )}
                    </div>
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
        overflowY: 'auto', 
        backgroundColor: '#f0f2f5',
    },
    background: {
        width: '100%',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        padding: "20px",

        boxSizing: 'border-box',
        minHeight: '100vh',
        boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    },
    container: {
        width: "100%",
        maxWidth: "900px",
        padding: "30px", 
        textAlign: "left", 
        flexGrow: 1,
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 255, 255)', 
        borderRadius: '12px', 
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)", 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start', 
    },
    button: { 
        display: "inline-flex",
        alignItems: "center",
        marginBottom: "25px", 
        padding: "10px 22px", 
        backgroundColor: "white", 
        color: "#764ba2", 
        textDecoration: "none",
        borderRadius: "25px", 
        fontSize: "1em",
        fontWeight: "500",
        cursor: "pointer",
        border: "none",
        transition: "all 0.3s ease",
        gap: "8px", 
        flexShrink: 0,
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    buttonHover: {
        backgroundColor: "#e0e0e0", 
        transform: "translateY(-3px)", 
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    },
    buttonIcon: {
        fontSize: '1.2em', 
        color: '#764ba2', 
    },
    image: {
        width: "100%",
        maxHeight: "35vh", 
        objectFit: "cover", 
        borderRadius: "10px",
        marginBottom: "25px", 
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
        flexShrink: 0,
    },
    title: {
        fontSize: "2.5em", 
        fontWeight: "300", 

        marginBottom: "15px", 
        lineHeight: "1.2",
        flexShrink: 0,
        textAlign: 'left', 
    },
    meta: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px 30px", 
        fontSize: "0.9em", 
        marginBottom: "30px", 
        paddingBottom: "20px", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.3)", 
        flexShrink: 0,
        width: '100%', 
    },
    metaItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px", 
    },
    contentArea: {
        flexGrow: 1,
        fontSize: "1.1em", 
        lineHeight: "1.7", 

        whiteSpace: "pre-wrap",
        paddingBottom: "20px", 
        display: "flex",
        flexDirection: "column",
        alignItems: 'flex-start', 
        width: '100%', 
    },
    articleContentText: {
    },
    readMoreLink: {
        display: "inline-block",
        marginTop: "25px", 
        padding: "12px 25px", 
        backgroundColor: "#667eea", 
        color: "white",
        textDecoration: "none",
        borderRadius: "25px", 
        fontWeight: "600",
        transition: "all 0.3s ease",
        alignSelf: "flex-start",
        flexShrink: 0,
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    readMoreLinkHover: {
        backgroundColor: "#5a6ce6", 
        transform: "translateY(-3px)", 
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    },
    icon: {
        marginRight: "5px",

    },
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        fontSize: "18px",
        color: "white",
        fontWeight: '300',
    },
    errorMessage: {

        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        border: '1px solid rgba(255, 107, 107, 0.5)',
        borderRadius: '8px',
        padding: '15px',
        fontSize: '16px',
        textAlign: 'center',
        marginBottom: '20px',
        fontWeight: 'normal',
    },
    noArticleMessage: {

        fontSize: '18px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        marginBottom: '20px',
    }
};

const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
/* Keyframes from HomePage for consistency */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default NewsDetail;