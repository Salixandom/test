import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './CSS/style.css';

const GenreChart = ({ genreData }) => {
    // Extract the names and counts from the genreData array
    const names = genreData.map(data => data.genre_name);
    const counts = genreData.map(data => data.preference_count);

    // Create an array of colors for the pie chart slices
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(255, 0, 255, 0.6)', // Purple
        'rgba(0, 255, 255, 0.6)', // Cyan
        'rgba(128, 0, 128, 0.6)', // Indigo
        'rgba(255, 140, 0, 0.6)', // DarkOrange
        'rgba(0, 255, 0, 0.6)', // Lime
        'rgba(255, 69, 0, 0.6)', // OrangeRed
        'rgba(139, 0, 139, 0.6)', // DarkMagenta
        'rgba(0, 128, 0, 0.6)', // Green
        'rgba(255, 165, 0, 0.6)', // Orange
        'rgba(0, 128, 128, 0.6)', // Teal
        'rgba(255, 20, 147, 0.6)', // DeepPink
        'rgba(255, 215, 0, 0.6)', // Gold
        'rgba(0, 0, 139, 0.6)', // DarkBlue
        'rgba(210, 105, 30, 0.6)', // Chocolate
        'rgba(139, 69, 19, 0.6)', // SaddleBrown
        // Add more colors here if needed
    ];

    // Create the data object for the chart
    const data = {
        labels: names,
        datasets: [
            {
                label: 'User Count',
                data: counts,
                backgroundColor: colors.slice(0, genreData.length), // Use colors for each data slice
                borderColor: colors.slice(0, genreData.length), // Border color for each data slice
                borderWidth: 1,
            },
        ],
    };

    // Chart options
    const options = {
        plugins: {
            legend: {
                display: true,
                position: 'right' // Adjust legend position if needed
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="chart-container">
            <Pie data={data} options={options} />
        </div>
    );
};

export default GenreChart;
