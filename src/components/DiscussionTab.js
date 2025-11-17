// DiscussionTab.js

import React from 'react';
import { useTheme } from './ThemeContext';
import { ListSkeleton } from './LoadingComponents'; // ייבוא הסקלטון

export default function DiscussionTab({
    ticker,
    comments,
    commentsLoading,
    newComment,
    setNewComment,
    commentError,
    submitting,
    handleSubmitComment,
    handleDeleteComment,
    currentUserId,
    formatDate // פונקציה חיצונית לפורמט תאריך
}) {
    const { darkMode } = useTheme();

    return (
        <div>
            <h3 style={{ marginBottom: '16px' }}>Discussion for {ticker}</h3>

            <div style={{ marginBottom: '24px' }}>
                <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Share your thoughts about this stock..." 
                    maxLength={1000} 
                    style={{ 
                        width: '100%', 
                        minHeight: '100px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: `1px solid ${darkMode ? '#444' : '#ccc'}`, 
                        background: darkMode ? '#1e1e1e' : '#fff', 
                        color: darkMode ? '#f1f1f1' : '#111', 
                        fontSize: '14px', 
                        fontFamily: 'inherit', 
                        resize: 'vertical' 
                    }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{newComment.length}/1000</span>
                    <button 
                        onClick={handleSubmitComment} 
                        disabled={submitting || !newComment.trim()} 
                        style={{ 
                            padding: '8px 16px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            background: submitting || !newComment.trim() ? '#ccc' : '#2196f3', 
                            color: '#fff', 
                            cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
                {commentError && <div style={{ color: '#dc2626', marginTop: '8px', fontSize: '14px' }}>{commentError}</div>}
            </div>

            {commentsLoading && <ListSkeleton darkMode={darkMode} count={3} />}
            {!commentsLoading && comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#aaa' : '#666' }}>
                    No comments yet. Be the first to share your thoughts!
                </div>
            )}
            <div>
                {comments.map((comment) => (
                    <div key={comment._id} style={{ padding: '16px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                                <strong style={{ color: darkMode ? '#90caf9' : '#2196f3' }}>{comment.firstName}</strong>
                                <span style={{ marginLeft: '8px', fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{formatDate(comment.createdAt)}</span>
                            </div>
                            {currentUserId === comment.userId && (
                                <button onClick={() => handleDeleteComment(comment._id)} style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                                    Delete
                                </button>
                            )}
                        </div>
                        <p style={{ margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}