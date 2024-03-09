import React, { useState } from 'react';
import './CSS/style.css'

const ScoreDistributionGraph = ({ scoreData }) => {
    const [tooltip, setTooltip] = useState({ visible: false, content: '', posX: 0, posY: 0 });
    const scores = [
        { label: 1, value: parseInt(scoreData.rating_1, 10), color: '#e74c3c' },
        { label: 2, value: parseInt(scoreData.rating_2, 10), color: '#e67e22' },
        { label: 3, value: parseInt(scoreData.rating_3, 10), color: '#f1c40f' },
        { label: 4, value: parseInt(scoreData.rating_4, 10), color: '#2ecc71' },
        { label: 5, value: parseInt(scoreData.rating_5, 10), color: '#3498db' },
        { label: 6, value: parseInt(scoreData.rating_6, 10), color: '#9b59b6' },
        { label: 7, value: parseInt(scoreData.rating_7, 10), color: '#e74c3c' },
        { label: 8, value: parseInt(scoreData.rating_8, 10), color: '#e67e22' },
        { label: 9, value: parseInt(scoreData.rating_9, 10), color: '#f1c40f' },
        { label: 10, value: parseInt(scoreData.rating_10, 10), color: '#2ecc71' },
    ];

    const maxValue = Math.max(...scores.map(score => score.value));
    const containerRef = React.createRef();
    const [show, setShow] = useState(false);

    const handleMouseEnter = (e, score) => {
        const containerRect = containerRef.current.getBoundingClientRect();
        /* setTooltip({
            visible: true,
            content: `${score.label} - ${score.value} Users`,
            posX: e.clientX - containerRect.left, // relative to the container
            posY: e.clientY - containerRect.top // relative to the container
        }); */
    };

    return (
        <div ref={containerRef} style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px',
            background: 'rgb(37, 49, 66)',
            borderRadius: '8px',
            height: '200px', // Set a fixed height for the container
            position: 'relative',
        }}
            onMouseLeave={() => setShow(false)}
            onMouseEnter={() => setShow(true)}
        >
            {scores.map((score, index) => (
                <div key={index} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end' }}
                    onMouseEnter={(e) => handleMouseEnter(e, score)}>
                    <div
                        style={{
                            height: `${(score.value / maxValue) * 100}%`, // Calculate the height as a percentage
                            backgroundColor: score.color,
                            width: '20px', // Set a fixed width for the bars
                            margin: '0 auto', // Center the bars within the flex item
                            borderRadius: '5px',
                            transition: 'height 0.3s ease-in-out',
                            cursor: 'pointer',
                        }}
                    />
                    {show && (
                        <>
                            <span style={{ position: 'absolute', width: '100%', textAlign: 'center', bottom: `${(score.value / maxValue) * 100}%`, color: `${score.color}` }}>{score.value}</span>
                            <span style={{ position: 'absolute', width: '100%', textAlign: 'center', bottom: '-20px', color: `${score.color}` }}>{score.label}</span>
                        </>
                    )}
                </div>
            ))}
            {/* {tooltip.visible && (
                <div style={{
                    position: 'absolute',
                    top: `${tooltip.posY}px`,
                    left: `${tooltip.posX}px`,
                    transform: 'translate(-50%, -100%)',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '4px',
                    pointerEvents: 'none', // Ignore pointer events
                }}>
                    {tooltip.content}
                </div>
            )} */}
        </div>
    );
};

export default ScoreDistributionGraph;
