import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import type { Customer } from '../../types';

interface ChartProps {
  customers: Customer[] | undefined;
}

const COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea'];

export function CustomerSegmentChart({ customers }: ChartProps) {
  if (!customers) return null;

  const segmentCounts = customers.reduce((acc, customer) => {
    acc[customer.segment] = (acc[customer.segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(segmentCounts).map(key => ({
    name: key,
    value: segmentCounts[key]
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StateRevenueChart({ customers }: ChartProps) {
  if (!customers) return null;

  const stateRevenue = customers.reduce((acc, customer) => {
    acc[customer.state] = (acc[customer.state] || 0) + customer.revenueGenerated;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(stateRevenue).map(key => ({
    state: key,
    revenue: stateRevenue[key]
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5); // Top 5 states

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{fill: '#64748b', fontSize: 12}}
          tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
        />
        <RechartsTooltip 
          formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
          cursor={{fill: '#f1f5f9'}}
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
