import React, { useState } from 'react';
import './CSS/style.css'

const SegmentedProgressBar = ({ statusSegment }) => {
    const segments = [
        { name: 'Current', users: parseInt(statusSegment.watching, 10), color: '#2ecc71' },
        { name: 'Planning', users: parseInt(statusSegment.planning, 10), color: '#3498db' },
        { name: 'Dropped', users: parseInt(statusSegment.dropped, 10), color: '#e74c3c' },
        { name: 'Completed', users: parseInt(statusSegment.completed, 10), color: '#9b59b6' },
        { name: 'Paused', users: parseInt(statusSegment.paused, 10), color: '#f1c40f' }
    ];
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const totalUsers = segments.reduce((total, segment) => total + segment.users, 0);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {hoveredSegment !== null && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: `${hoveredSegment.offset}%`,
                        transform: 'translateX(-50%)',
                        marginBottom: '5px',
                        padding: '2px 5px',
                        backgroundColor: 'black',
                        color: 'white',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {hoveredSegment.name}: {((hoveredSegment.users / totalUsers) * 100).toFixed(2)}%
                </div>
            )}
            <div className="segmented-progress-bar" style={{ display: 'flex', width: '100%', height: '20px', backgroundColor: '#eee' }}>
                {segments.map((segment, index) => {
                    const segmentPercentage = (segment.users / totalUsers) * 100;
                    return (
                        <div
                            key={index}
                            onMouseEnter={() => setHoveredSegment({ ...segment, offset: segmentPercentage / 2 + (segments.slice(0, index).reduce((acc, seg) => acc + (seg.users / totalUsers) * 100, 0)) })}
                            onMouseLeave={() => setHoveredSegment(null)}
                            style={{
                                flex: segment.users / totalUsers, // This sets the width as a fraction of the total
                                backgroundColor: segment.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.8em',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SegmentedProgressBar;
