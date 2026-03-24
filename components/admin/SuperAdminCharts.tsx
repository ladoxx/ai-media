'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface Props {
  postsPerDay: { day: string; count: number }[]
  categoryData: { name: string; count: number; color: string }[]
}

const RADIAN = Math.PI / 180
function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) {
  if ((percent ?? 0) < 0.05) return null
  const _cx = cx ?? 0
  const _cy = cy ?? 0
  const _midAngle = midAngle ?? 0
  const _innerRadius = innerRadius ?? 0
  const _outerRadius = outerRadius ?? 0
  const radius = _innerRadius + (_outerRadius - _innerRadius) * 0.5
  const x = _cx + radius * Math.cos(-_midAngle * RADIAN)
  const y = _cy + radius * Math.sin(-_midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  )
}

export function SuperAdminCharts({ postsPerDay, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Posts Per Day — Bar Chart */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#f0f0fa] mb-1">Son 30 Günde Yayınlanan Yazılar</h3>
        <p className="text-xs text-[#606080] mb-4">Günlük yayın aktivitesi</p>
        {postsPerDay.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[#606080] text-sm">
            Henüz veri yok
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={postsPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: '#606080', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#606080', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#16162a',
                  border: '1px solid #1e1e35',
                  borderRadius: 8,
                  color: '#f0f0fa',
                  fontSize: 12,
                }}
                cursor={{ fill: '#1e1e35' }}
                formatter={(value) => [value ?? 0, 'Yazı']}
              />
              <Bar dataKey="count" fill="#f7931a" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Distribution — Pie Chart */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#f0f0fa] mb-1">Kategori Dağılımı</h3>
        <p className="text-xs text-[#606080] mb-4">Yazıların kategorilere göre dağılımı</p>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[#606080] text-sm">
            Henüz kategori yok
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#16162a',
                  border: '1px solid #1e1e35',
                  borderRadius: 8,
                  color: '#f0f0fa',
                  fontSize: 12,
                }}
                formatter={(value, name) => [value ?? 0, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#606080', fontSize: 11 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
