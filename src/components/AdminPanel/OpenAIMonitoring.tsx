import React, { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';

export default function OpenAIMonitoring() {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<Array<{
    timestamp: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generate realistic mock data based on timeframe
        const now = new Date();
        const mockData = [];
        
        const daysToGenerate = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
        
        for (let i = 0; i < daysToGenerate; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          // Generate random but realistic token counts
          const promptTokens = Math.floor(800 + Math.random() * 400);
          const completionTokens = Math.floor(400 + Math.random() * 200);
          
          mockData.unshift({
            timestamp: date.toISOString(),
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens
          });
        }
        
        setUsageData(mockData);
        setError(null);

      } catch (error) {
        console.error('Error fetching OpenAI usage:', error);
        setError('Erreur lors de la récupération des données d\'utilisation');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [timeframe]);

  const totalTokens = usageData.reduce((sum, day) => sum + day.total_tokens, 0);
  const averageTokens = Math.round(totalTokens / (usageData.length || 1));

  const lineData = [
    {
      id: 'Total Tokens',
      data: usageData.map(day => ({
        x: new Date(day.timestamp).toLocaleDateString(),
        y: day.total_tokens
      }))
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Monitoring OpenAI
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '24h' | '7d' | '30d')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Tokens
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Moyenne par jour
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {averageTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Coût estimé
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {((totalTokens / 1000) * 0.02).toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Usage Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Utilisation des tokens
        </h2>
        
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center text-red-500 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveLine
              data={lineData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Date',
                legendOffset: 40,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Tokens',
                legendOffset: -50,
                legendPosition: 'middle'
              }}
              colors={{ scheme: 'category10' }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fill: '#6B7280'
                    }
                  },
                  legend: {
                    text: {
                      fill: '#6B7280'
                    }
                  }
                },
                grid: {
                  line: {
                    stroke: '#E5E7EB',
                    strokeWidth: 1
                  }
                },
                legends: {
                  text: {
                    fill: '#6B7280'
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}