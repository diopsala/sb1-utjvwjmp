import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Award, Download, Clock, BarChart2, Filter, ExternalLink } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Subject } from '../../types/subjects';
import { RevisionPerformance } from '../../types/revisions';

interface RevisionStatsProps {
  performances: RevisionPerformance[];
  subject: Subject | null;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function RevisionStats({
  performances,
  subject,
  onBack,
  isDarkMode
}: RevisionStatsProps) {
  const { currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState<boolean>(false);
  const [filteredPerformances, setFilteredPerformances] = useState<RevisionPerformance[]>(performances);
  const [subjectPerformances, setSubjectPerformances] = useState<RevisionPerformance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [averageScores, setAverageScores] = useState<{[key: string]: number}>({});
  const [exportLoading, setExportLoading] = useState(false);

  // Effect to filter performances based on timeframe
  useEffect(() => {
    if (!performances.length) return;

    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filtered = performances.filter(p => {
      const performanceDate = new Date(p.created_at);
      return performanceDate >= cutoffDate;
    });
    
    setFilteredPerformances(filtered);
  }, [performances, timeframe]);

  // Fetch average scores from user_stats
  useEffect(() => {
    const fetchAverageScores = async () => {
      if (!currentUser) return;
      
      try {
        const userStatsDoc = await getDoc(doc(db, 'user_stats', currentUser.uid));
        if (userStatsDoc.exists() && userStatsDoc.data().averageScores) {
          setAverageScores(userStatsDoc.data().averageScores);
        }
      } catch (error) {
        console.error('Error fetching average scores:', error);
      }
    };
    
    fetchAverageScores();
  }, [currentUser]);

  // Fetch performances for the specific subject if available
  useEffect(() => {
    if (!currentUser || !subject) return;
    
    const fetchSubjectPerformances = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'revision_performances', currentUser.uid, 'records'),
          where('subject', '==', subject.id),
          orderBy('created_at', 'desc'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const performancesData = querySnapshot.docs.map(doc => ({
          ...doc.data() as RevisionPerformance,
          id: doc.id
        }));
        
        setSubjectPerformances(performancesData);
      } catch (error) {
        console.error('Error fetching subject performances:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjectPerformances();
  }, [currentUser, subject]);
  
  // Format date
  const formatDate = (dateString: string, format: 'short' | 'full' = 'short') => {
    const date = new Date(dateString);
    if (format === 'short') {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate average score
  const calculateAverage = (data: RevisionPerformance[]) => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / data.length);
  };
  
  // Calculate improvement (compare first and last performances)
  const calculateImprovement = (data: RevisionPerformance[]) => {
    if (data.length < 2) return null;
    
    const sortedData = [...data].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstScore = sortedData[0].score;
    const lastScore = sortedData[sortedData.length - 1].score;
    
    return lastScore - firstScore;
  };
  
  // Calculate success rate
  const calculateSuccessRate = (data: RevisionPerformance[]) => {
    if (!data.length) return 0;
    const passedCount = data.filter(p => p.passed).length;
    return Math.round((passedCount / data.length) * 100);
  };

  // Calculate average time spent on quizzes (in minutes)
  const calculateAverageTime = (data: RevisionPerformance[]) => {
    if (!data.length) return 0;
    
    let totalTime = 0;
    let validTimeCount = 0;
    
    data.forEach(p => {
      if (p.created_at && p.finished_at) {
        const startTime = new Date(p.created_at).getTime();
        const endTime = new Date(p.finished_at).getTime();
        const durationMinutes = (endTime - startTime) / (1000 * 60);
        
        // Only count reasonable times (less than 60 minutes per quiz)
        if (durationMinutes > 0 && durationMinutes < 60) {
          totalTime += durationMinutes;
          validTimeCount++;
        }
      }
    });
    
    return validTimeCount > 0 ? Math.round(totalTime / validTimeCount) : 0;
  };
  
  // Prepare data for line chart
  const prepareLineChartData = () => {
    // Use subject performances if available, otherwise use filtered performances
    const dataToUse = subject && subjectPerformances.length > 0 
      ? subjectPerformances
      : filteredPerformances;
    
    if (dataToUse.length === 0) return [];
    
    // Sort by date
    const sortedData = [...dataToUse].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return [
      {
        id: "score",
        data: sortedData.map(p => ({
          x: formatDate(p.created_at),
          y: p.score
        }))
      }
    ];
  };
  
  // Prepare data for bar chart
  const prepareBarChartData = () => {
    // Group performances by subject
    const subjectGroups: Record<string, RevisionPerformance[]> = {};
    
    filteredPerformances.forEach(p => {
      if (!subjectGroups[p.subject]) {
        subjectGroups[p.subject] = [];
      }
      subjectGroups[p.subject].push(p);
    });
    
    return Object.entries(subjectGroups).map(([subjectId, performances]) => {
      const storedAvg = averageScores[subjectId];
      const calculatedAvg = calculateAverage(performances);
      
      return {
        subject: subjectId,
        avgScore: storedAvg || calculatedAvg,
        quizCount: performances.length
      };
    }).sort((a, b) => b.avgScore - a.avgScore); // Sort by highest average score
  };

  // Prepare difficulty distribution data
  const prepareDifficultyDistribution = () => {
    const dataToUse = subject && subjectPerformances.length > 0
      ? subjectPerformances
      : filteredPerformances;
    
    // Initialize counts for each difficulty level
    const difficultyCount = {
      1: { total: 0, passed: 0 },
      2: { total: 0, passed: 0 },
      3: { total: 0, passed: 0 },
      4: { total: 0, passed: 0 },
      5: { total: 0, passed: 0 }
    };
    
    // Count performances by difficulty
    dataToUse.forEach(p => {
      if (p.difficulty >= 1 && p.difficulty <= 5) {
        difficultyCount[p.difficulty].total += 1;
        if (p.passed) {
          difficultyCount[p.difficulty].passed += 1;
        }
      }
    });
    
    // Convert to format needed by the chart
    return Object.entries(difficultyCount).map(([level, data]) => ({
      level: `Niveau ${level}`,
      completed: data.total,
      passed: data.passed,
      failed: data.total - data.passed
    }));
  };

  // Export statistics to CSV
  const exportToCSV = () => {
    setExportLoading(true);
    
    try {
      const dataToExport = subject && subjectPerformances.length > 0
        ? subjectPerformances
        : filteredPerformances;
      
      if (dataToExport.length === 0) {
        alert('Aucune donnée à exporter');
        setExportLoading(false);
        return;
      }
      
      // Prepare CSV headers
      const headers = ['Matière', 'Difficulté', 'Score (%)', 'Validé', 'Questions Totales', 'Bonnes Réponses', 'Date'];
      
      // Prepare CSV content
      const csvContent = dataToExport.map(p => [
        p.subject,
        p.difficulty,
        p.score,
        p.passed ? 'Oui' : 'Non',
        p.totalQuestions,
        p.correctAnswers,
        formatDate(p.created_at, 'full')
      ]);
      
      // Combine headers and data
      const csv = [
        headers.join(','),
        ...csvContent.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `statistiques_${subject ? subject.label : 'toutes_matières'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting statistics:', error);
      alert('Erreur lors de l\'exportation des statistiques');
    } finally {
      setExportLoading(false);
    }
  };

  const lineChartData = prepareLineChartData();
  const barChartData = prepareBarChartData();
  const difficultyData = prepareDifficultyDistribution();
  
  const averageScore = calculateAverage(filteredPerformances);
  const improvement = calculateImprovement(filteredPerformances);
  const successRate = calculateSuccessRate(filteredPerformances);
  const averageTime = calculateAverageTime(filteredPerformances);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stats header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {subject ? `Statistiques - ${subject.label}` : 'Statistiques de révision'}
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Suivez votre progression et analysez vos performances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={exportLoading || filteredPerformances.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:text-gray-400'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:text-gray-400'
            } transition-colors disabled:opacity-50`}
          >
            <Download className="w-5 h-5" />
            {exportLoading ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>
      
      {/* Timeframe selector */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className={`inline-flex rounded-md shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeframe === 'week'
                ? isDarkMode 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 text-sm font-medium ${
              timeframe === 'month'
                ? isDarkMode 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeframe === 'year'
                ? isDarkMode 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Année
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {subject 
              ? `Filtré par: ${subject.label}` 
              : `Période: ${
                  timeframe === 'week' ? 'Derniers 7 jours' :
                  timeframe === 'month' ? 'Dernier mois' : 'Dernière année'
                }`
            }
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPerformances.length === 0 ? (
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm text-center`}>
          <TrendingUp className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pas encore de données</h3>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Complétez quelques quiz pour voir vos statistiques ici
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Score moyen
                </h3>
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <TrendingUp className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${
                averageScore >= 70
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : averageScore >= 50
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {averageScore}%
              </p>
            </div>
            
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Taux de réussite
                </h3>
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Award className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${
                successRate >= 70
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : successRate >= 50
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {successRate}%
              </p>
            </div>
            
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Progression
                </h3>
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Calendar className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${
                improvement !== null
                  ? improvement > 0
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : improvement < 0
                      ? isDarkMode ? 'text-red-400' : 'text-red-600'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {improvement !== null 
                  ? improvement > 0 
                    ? `+${improvement}%` 
                    : `${improvement}%`
                  : '-'}
              </p>
            </div>
            
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Temps moyen
                </h3>
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                  <Clock className={`h-5 w-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {averageTime} min
              </p>
            </div>
          </div>
          
          {/* Performance over time chart */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {subject ? `Évolution des scores - ${subject.label}` : 'Évolution des scores'}
            </h3>
            
            {lineChartData.length > 0 && lineChartData[0].data.length > 0 ? (
              <div className="h-72">
                <ResponsiveLine
                  data={lineChartData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 0,
                    max: 100,
                    stacked: false,
                  }}
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
                    legend: 'Score (%)',
                    legendOffset: -40,
                    legendPosition: 'middle'
                  }}
                  enableGridX={false}
                  colors={{ scheme: 'category10' }}
                  lineWidth={3}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  enablePointLabel={true}
                  pointLabel="y"
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[]}
                  theme={{
                    fontFamily: 'sans-serif',
                    textColor: isDarkMode ? '#e5e7eb' : '#374151',
                    grid: {
                      line: {
                        stroke: isDarkMode ? '#4b5563' : '#e5e7eb',
                      },
                    },
                    crosshair: {
                      line: {
                        stroke: isDarkMode ? '#9ca3af' : '#6b7280',
                        strokeOpacity: 0.5,
                        strokeWidth: 1,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pas assez de données pour afficher le graphique
              </div>
            )}
          </div>
          
          {/* Subject comparison chart (only if not viewing a specific subject) */}
          {!subject && barChartData.length > 1 && (
            <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className={`text-lg font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Comparaison par matière
              </h3>
              
              <div className="h-72">
                <ResponsiveBar
                  data={barChartData}
                  keys={['avgScore']}
                  indexBy="subject"
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  padding={0.3}
                  valueScale={{ type: 'linear', min: 0, max: 100 }}
                  indexScale={{ type: 'band', round: true }}
                  colors={{ scheme: 'category10' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Matière',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Score moyen (%)',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ theme: 'background' }}
                  theme={{
                    fontFamily: 'sans-serif',
                    textColor: isDarkMode ? '#e5e7eb' : '#374151',
                    grid: {
                      line: {
                        stroke: isDarkMode ? '#4b5563' : '#e5e7eb',
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Difficulty distribution chart */}
          {difficultyData.filter(d => d.completed > 0).length > 0 && (
            <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className={`text-lg font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Distribution par niveau de difficulté
              </h3>
              
              <div className="h-72">
                <ResponsiveBar
                  data={difficultyData}
                  keys={['passed', 'failed']}
                  indexBy="level"
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  padding={0.3}
                  groupMode="grouped"
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={isDarkMode ? ['#22c55e', '#ef4444'] : ['#10b981', '#f87171']}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Niveau de difficulté',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Nombre de quiz',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ theme: 'background' }}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'top-right',
                      direction: 'column',
                      justify: false,
                      translateX: 0,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                  theme={{
                    fontFamily: 'sans-serif',
                    textColor: isDarkMode ? '#e5e7eb' : '#374151',
                    legends: {
                      text: {
                        fill: isDarkMode ? '#e5e7eb' : '#374151'
                      }
                    },
                    grid: {
                      line: {
                        stroke: isDarkMode ? '#4b5563' : '#e5e7eb',
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Recent quiz history */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Historique récent
              </h3>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {filteredPerformances.length} quiz
                </span>
                <BarChart2 className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Date
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Matière
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Niveau
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Score
                    </th>
                    <th scope="col" className={`px-6 py-3 text-center text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {filteredPerformances.slice(0, 10).map((performance, index) => (
                    <tr key={index} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatDate(performance.created_at, 'full')}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {performance.subject}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {performance.difficulty}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        performance.score >= 70
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : performance.score >= 50
                            ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                            : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {performance.score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          performance.passed
                            ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                        }`}>
                          {performance.passed ? 'Validé' : 'Non validé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredPerformances.length > 10 && (
              <div className="mt-4 text-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Affichage des 10 derniers quiz sur {filteredPerformances.length} au total
                </span>
              </div>
            )}
          </div>
          
          {/* Achievement insights */}
          <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Insights personnalisés
            </h3>
            
            <div className="space-y-4">
              {averageScore >= 80 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} flex items-start gap-3`}>
                  <Award className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                      Excellent niveau !
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                      Avec un score moyen de {averageScore}%, vous maîtrisez très bien cette matière. 
                      Continuez à vous challenger avec des niveaux de difficulté plus élevés.
                    </p>
                  </div>
                </div>
              )}
              
              {improvement !== null && improvement > 10 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} flex items-start gap-3`}>
                  <TrendingUp className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      Progression remarquable !
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      Vous avez progressé de {improvement}% depuis votre premier quiz. 
                      Continuez sur cette lancée !
                    </p>
                  </div>
                </div>
              )}
              
              {filteredPerformances.length >= 5 && successRate < 50 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} flex items-start gap-3`}>
                  <Calendar className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Conseil de révision
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                      Votre taux de réussite est de {successRate}%. Essayez de revenir aux niveaux de base
                      pour consolider vos connaissances avant de progresser vers les niveaux supérieurs.
                    </p>
                  </div>
                </div>
              )}
              
              {filteredPerformances.length < 5 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'} flex items-start gap-3`}>
                  <ExternalLink className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      En route vers l'expertise
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                      Complétez au moins 5 quiz pour obtenir des statistiques plus précises et des recommandations personnalisées.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Back button */}
      <div className="flex justify-center">
        <button
          onClick={onBack}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          } transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux résultats
        </button>
      </div>
    </div>
  );
}