'use client'

import { useEffect, useState } from 'react'
import { Users, MessageSquare, Bot, Activity, TrendingUp } from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  users: { total: number; last7Days: number; last30Days: number; active7Days: number }
  chats: { total: number; last7Days: number }
  messages: { total: number }
  agents: { total: number }
}

interface RecentUser {
  id: string
  name: string | null
  email: string
  createdAt: string
  isActive: boolean
}

interface AuditEntry {
  id: string
  action: string
  createdAt: string
  adminUser?: { name: string | null; email: string } | null
  user?: { name: string | null; email: string } | null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, usersRes, auditRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users?limit=5'),
          fetch('/api/admin/audit?limit=8'),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (usersRes.ok) {
          const data = await usersRes.json()
          setRecentUsers(data.users)
        }
        if (auditRes.ok) {
          const data = await auditRes.json()
          setRecentActivity(data.logs)
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">System overview</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">System overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.users.total ?? 0}
          description={`+${stats?.users.last7Days ?? 0} last 7 days`}
          icon={Users}
        />
        <StatsCard
          title="Total Chats"
          value={stats?.chats.total ?? 0}
          description={`+${stats?.chats.last7Days ?? 0} last 7 days`}
          icon={MessageSquare}
        />
        <StatsCard
          title="Total Messages"
          value={(stats?.messages.total ?? 0).toLocaleString()}
          icon={Activity}
        />
        <StatsCard
          title="Agents Created"
          value={stats?.agents.total ?? 0}
          icon={Bot}
        />
      </div>

      {/* Active Users Highlight */}
      {stats && stats.users.active7Days > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm">
              <span className="font-semibold">{stats.users.active7Days}</span> active users in the
              last 7 days &middot;{' '}
              <span className="font-semibold">{stats.users.last30Days}</span> new users in the last
              30 days
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Users + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{user.name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{formatAction(entry.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.adminUser
                          ? `by ${entry.adminUser.name || entry.adminUser.email}`
                          : entry.user
                            ? `by ${entry.user.name || entry.user.email}`
                            : 'System'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    'user.created': 'User Created',
    'user.updated': 'User Updated',
    'user.deleted': 'User Deleted',
    'chat.deleted': 'Chat Deleted',
    'chat.archived': 'Chat Archived',
    'chat.restored': 'Chat Restored',
    'agent.deleted': 'Agent Deleted',
    'admin.created': 'Admin Created',
    'settings.updated': 'Settings Updated',
  }
  return labels[action] || action
}
