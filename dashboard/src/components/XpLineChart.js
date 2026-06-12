import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function XpLineChart({ labels, values }) {
  return (
    <Line
      data={{
        labels,
        datasets: [{
          label: 'XP Earned',
          data: values,
          borderColor: '#5865F2',
          backgroundColor: 'rgba(88, 101, 242, 0.15)',
          fill: true,
          tension: 0.3,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: '#ccc' } },
        },
        scales: {
          x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        },
      }}
    />
  );
}
