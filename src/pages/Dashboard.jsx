import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { format, differenceInDays, addDays } from 'date-fns';

const COLUMNS = ['Backlog', 'In Review', 'Planned', 'In Progress', 'Completed'];
const COLORS = { Backlog: '#64748b', 'In Review': '#3b82f6', Planned: '#8b5cf6', 'In Progress': null, Completed: '#10b981' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Dashboard = () => {
  const { isDark, accentColor } = useTheme();
  const { currentWorkspace, members } = useWorkspace() || {};
  const { activeProject, updateProjectDates, kanban, changelog, roadmap, bugs } = useData();
  const textColor = isDark ? '#ffffff' : '#0f172a';

  const baseColor = accentColor || '#7e22ce';

  const columnCounts = useMemo(() => {
    const counts = COLUMNS.reduce((acc, c) => ({ ...acc, [c]: 0 }), {});
    kanban.forEach(task => { if (counts[task.column] !== undefined) counts[task.column]++; });
    return counts;
  }, [kanban]);

  const donutData = useMemo(() => COLUMNS.map(c => ({
    value: columnCounts[c],
    name: c,
    itemStyle: { color: c === 'In Progress' ? baseColor : COLORS[c] }
  })), [columnCounts, baseColor]);

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const donutOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '0%', top: 'center', textStyle: { color: textColor, fontSize: 12 } },
    title: donutTotal
      ? undefined
      : { text: '0', left: 'center', top: 'center', textStyle: { color: textColor, fontSize: 48, fontWeight: 900 } },
    series: [{
      name: 'Status',
      type: 'pie',
      radius: donutTotal ? ['50%', '80%'] : ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: isDark ? '#000000' : '#fff', borderWidth: 4 },
      label: { show: false },
      data: donutData
    }]
  };

  const completedByDay = useMemo(() => {
    const perDay = new Array(7).fill(0);
    // count completed tasks modulo 7 for demo shape; replace with real velocity later
    kanban.filter(k => k.column === 'Completed').forEach((_, i) => perDay[i % 7]++);
    return perDay;
  }, [kanban]);

  const lineOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: DAYS, axisLabel: { color: textColor }, axisLine: { lineStyle: { color: isDark ? '#1f1f23' : '#e2e8f0' } } },
    yAxis: { type: 'value', min: 0, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: isDark ? '#1f1f23' : '#f1f5f9' } } },
    series: [{
      data: kanban.length ? completedByDay : new Array(7).fill(0),
      type: 'line',
      smooth: true,
      lineStyle: { color: baseColor, width: 4 },
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: baseColor },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: baseColor }, { offset: 1, color: 'transparent' }] }, opacity: 0.1 }
    }]
  };

  const completedTasks = kanban.filter(k => k.column === 'Completed').length;
  const inProgressTasks = kanban.filter(k => k.column === 'In Progress').length;

  const stats = [
    { label: 'Registered Users', value: (members?.length || 0).toString(), icon: FiIcons.FiUsers, trend: '0%' },
    { label: 'Submissions', value: (roadmap?.length || 0).toString(), icon: FiIcons.FiInbox, trend: '0%' },
    { label: 'Total Upvotes', value: (roadmap.reduce((s, r) => s + (r.upvotes || 0), 0)).toString(), icon: FiIcons.FiArrowUp, trend: '0%' },
    { label: 'Open Bugs', value: (bugs?.length || 0).toString(), icon: FiIcons.FiAlertCircle, trend: '0%' },
    { label: 'Tasks Completed', value: completedTasks.toString(), icon: FiIcons.FiCheckCircle, trend: '0%' },
    { label: 'People Involved', value: (members?.length || 0).toString(), icon: FiIcons.FiUserCheck, trend: '0%' },
  ];

  const ganttData = useMemo(() => {
    if (!activeProject?.startDate || !activeProject?.expectedEndDate || !kanban.length) return [];
    const start = new Date(activeProject.startDate);
    const end = new Date(activeProject.expectedEndDate);
    const totalDays = differenceInDays(end, start);
    const totalTasks = kanban.length || 1;
    const daysPerTask = Math.max(1, Math.floor(totalDays / totalTasks));

    return kanban.map((task, index) => {
      const plannedStart = addDays(start, index * daysPerTask);
      const plannedEnd = addDays(plannedStart, daysPerTask);
      const inProgressDate = task.column !== 'Planned' ? addDays(plannedStart, 1) : null;
      const completedEntry = changelog.find(c => c.note && c.note.includes(task.title));
      const actualEnd = completedEntry ? new Date(completedEntry.date) : null;

      return {
        id: task.id,
        name: task.title,
        expectedStart: format(plannedStart, 'yyyy-MM-dd'),
        expectedTime: `${daysPerTask} Days`,
        inProgressDate: inProgressDate ? format(inProgressDate, 'yyyy-MM-dd') : '-',
        completionDate: actualEnd ? format(actualEnd, 'yyyy-MM-dd') : '-',
        chartData: { planned: [plannedStart, plannedEnd], actual: actualEnd ? [plannedStart, actualEnd] : (inProgressDate ? [plannedStart, new Date()] : null) }
      };
    });
  }, [activeProject, kanban, changelog]);

  const ganttChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '10%' },
    xAxis: { type: 'time', axisLabel: { color: textColor, fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? '#1f1f23' : '#f1f5f9' } } },
    yAxis: { type: 'category', show: false, data: ganttData.map(t => t.name) },
    series: [
      { name: 'Planned', type: 'bar', stack: 'duration', itemStyle: { color: baseColor, opacity: 0.2, borderRadius: 4 }, data: ganttData.map(t => ({ value: [t.chartData.planned[0], t.chartData.planned[1]], name: t.name })) },
      { name: 'Actual', type: 'bar', itemStyle: { color: '#10b981', borderRadius: 4 }, data: ganttData.map(t => ({ value: t.chartData.actual ? [t.chartData.actual[0], t.chartData.actual[1]] : [null, null], name: t.name })) }
    ]
  };



  return (
    <div className="w-full p-8 space-y-8 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-main)] uppercase">
            {currentWorkspace?.name || activeProject?.name || 'Workspace'}
          </h1>
          {currentWorkspace && (
            <p className="text-[var(--text-muted)] font-bold mt-1">{currentWorkspace.company_name || currentWorkspace.slug}</p>
          )}
          {activeProject && (
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Start Date</span>
                <input type="date" value={activeProject?.startDate || ''} onChange={(e) => updateProjectDates(activeProject.id, 'startDate', e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-main)]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Expected End</span>
                <input type="date" value={activeProject?.expectedEndDate || ''} onChange={(e) => updateProjectDates(activeProject.id, 'expectedEndDate', e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-main)]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Actual End</span>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] min-w-[120px]">
                  {activeProject?.actualEndDate || 'Ongoing...'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm group hover:border-[var(--accent)] transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)]">
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-green-500 bg-green-500/10">{stat.trend}</span>
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap truncate">{stat.label}</p>
            <p className="text-2xl font-black mt-1 text-[var(--text-main)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-[var(--text-main)]">Submissions</h3>
          <ReactECharts option={donutOption} style={{ height: '350px' }} />
        </div>
        <div className="lg:col-span-7 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-[var(--text-main)]">Velocity</h3>
          <ReactECharts option={lineOption} style={{ height: '350px' }} />
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-main)]">Project Schedule &amp; Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[var(--bg-main)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-color)]">
                <th className="p-6">Task Name</th>
                <th className="p-6">Expected Start</th>
                <th className="p-6">Expected Time</th>
                <th className="p-6">In-Progress Date</th>
                <th className="p-6">Completion Date</th>
                <th className="p-6">Visual Timeline</th>
              </tr>
            </thead>
            <tbody>
              {ganttData.length ? ganttData.map((task, idx) => (
                <tr key={task.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/30 transition-colors">
                  <td className="p-6 font-bold text-sm text-[var(--text-main)] max-w-[200px] truncate">{task.name}</td>
                  <td className="p-6 font-bold text-xs text-[var(--text-muted)]">{task.expectedStart}</td>
                  <td className="p-6 font-bold text-xs text-[var(--text-muted)]">{task.expectedTime}</td>
                  <td className="p-6 font-bold text-xs text-[var(--text-muted)]">{task.inProgressDate}</td>
                  <td className="p-6 font-bold text-xs text-green-500">{task.completionDate}</td>
                  <td className="p-0 w-1/3">
                    <div className="h-12 w-full relative">
                      <div className="absolute inset-0 flex items-center px-4">
                        <div className="h-2 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent)] opacity-40 rounded-full" style={{ marginLeft: `${(idx / ganttData.length) * 50}%`, width: `${100 / ganttData.length}%` }} />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">No schedule yet. Add a project and tasks to see the Gantt.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {ganttData.length > 0 && (
          <div className="p-8 bg-[var(--bg-main)]/20">
            <ReactECharts option={ganttChartOption} style={{ height: '300px' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
