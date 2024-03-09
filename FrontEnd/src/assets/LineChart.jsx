import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './CSS/style.css'

const LineChart = ({ interactionsData }) => {
    // Extract the dates and counts from the interactionsData array
    const dates = interactionsData.map(data => {
        const date = new Date(data.interaction_date);
        return date.getDate();
    });
    const counts = interactionsData.map(data => data.interaction_count);

    // Create the data object for the chart
    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Interactions',
                data: counts,
                fill: true,
                backgroundColor: 'rgba(135, 206, 250, 0.2)',
                borderColor: 'rgba(0, 123, 255, 1)',
                tension: 0.45,
                pointBackgroundColor: 'rgba(0, 125, 255, 1)',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: 'rgba(0, 123, 255, 1)',
                pointRadius: 4.5,
                pointHoverRadius: 5.5,
            },
        ],
    };

    // Chart options
    const options = {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                display: false
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="chart-container">
            <Line data={data} options={options} />
        </div>
    );
};

export default LineChart;
