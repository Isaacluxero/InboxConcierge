import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/auth';

const MetricCard = ({ title, value, subtitle, color = '#06b6d4' }) => (
  <div className="glass-dark" style={{
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    transition: 'all 0.3s ease'
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    e.currentTarget.style.transform = 'translateY(0)';
  }}>
    <div style={{
      fontSize: '0.875rem',
      color: 'rgba(255, 255, 255, 0.6)',
      marginBottom: '0.5rem',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {title}
    </div>
    <div style={{
      fontSize: '2.5rem',
      fontWeight: '800',
      color: color,
      marginBottom: '0.25rem',
      lineHeight: '1'
    }}>
      {value}
    </div>
    {subtitle && (
      <div style={{
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '400'
      }}>
        {subtitle}
      </div>
    )}
  </div>
);

const BucketBreakdownChart = ({ buckets }) => {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="glass-dark" style={{
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '1.5rem'
      }}>
        Emails by Bucket
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {buckets.map((bucket) => {
          const percentage = total > 0 ? (bucket.count / total) * 100 : 0;

          return (
            <div key={bucket.name}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: bucket.color
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500'
                  }}>
                    {bucket.name}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  {bucket.count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: bucket.color,
                  transition: 'width 0.5s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TopSendersList = ({ senders }) => (
  <div className="glass-dark" style={{
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.15)'
  }}>
    <h3 style={{
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.95)',
      marginBottom: '1.5rem'
    }}>
      Top Senders
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {senders.slice(0, 10).map((sender, index) => (
        <div
          key={sender.sender}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: 'white'
            }}>
              {index + 1}
            </div>
            <span style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500'
            }}>
              {sender.sender}
            </span>
          </div>
          <span style={{
            fontSize: '0.875rem',
            color: '#06b6d4',
            fontWeight: '700'
          }}>
            {sender.count}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const BusiestHoursChart = ({ hours }) => {
  const maxCount = Math.max(...hours.map(h => h.count), 1);

  return (
    <div className="glass-dark" style={{
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '1.5rem'
      }}>
        Busiest Hours
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {hours.map((hour) => {
          const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;

          return (
            <div key={hour.hour}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  {hour.hour}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#06b6d4', fontWeight: '600' }}>
                  {hour.count}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: '#06b6d4',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BusiestDaysChart = ({ days }) => {
  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="glass-dark" style={{
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '1.5rem'
      }}>
        Busiest Days of Week
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {days.map((day) => {
          const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

          return (
            <div key={day.day}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                  {day.day}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#0891b2', fontWeight: '600' }}>
                  {day.count}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: '#0891b2',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeDistributionChart = ({ distribution }) => {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  const colors = {
    morning: '#06b6d4',
    afternoon: '#0891b2',
    evening: '#0e7490',
    night: '#155e75'
  };

  return (
    <div className="glass-dark" style={{
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '1.5rem'
      }}>
        Time of Day Distribution
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(distribution).map(([period, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={period}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {period}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  color: colors[period],
                  fontWeight: '700'
                }}>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: colors[period],
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EmailVolumeChart = ({ emailsByDay }) => {
  const maxCount = Math.max(...emailsByDay.map(d => d.count), 1);

  return (
    <div className="glass-dark" style={{
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '1.5rem'
      }}>
        Email Volume (Last 30 Days)
      </h3>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '2px',
        height: '150px'
      }}>
        {emailsByDay.map((day) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

          return (
            <div
              key={day.date}
              title={`${new Date(day.date).toLocaleDateString()}: ${day.count} emails`}
              style={{
                flex: 1,
                height: `${height}%`,
                minHeight: day.count > 0 ? '4px' : '0',
                backgroundColor: '#06b6d4',
                borderRadius: '2px 2px 0 0',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0891b2';
                e.currentTarget.style.transform = 'scaleY(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#06b6d4';
                e.currentTarget.style.transform = 'scaleY(1)';
              }}
            />
          );
        })}
      </div>
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <span>{emailsByDay.length > 0 ? new Date(emailsByDay[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const Dashboard = ({ onClose }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getInsights
  });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTop: '4px solid #06b6d4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Loading insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" style={{ padding: '2rem', textAlign: 'center' }}>
        Failed to load analytics: {error.message}
      </div>
    );
  }

  const insights = data?.data;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.025em'
        }}>
          Email Insights
        </h2>
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Back to Inbox
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <MetricCard
          title="Total Emails"
          value={insights?.totalEmails?.toLocaleString() || '0'}
          color="#06b6d4"
        />
        <MetricCard
          title="Last 7 Days"
          value={insights?.recentActivity?.last7Days?.toLocaleString() || '0'}
          subtitle={`${insights?.recentActivity?.averagePerDay || 0}/day avg`}
          color="#0891b2"
        />
        <MetricCard
          title="Unique Senders"
          value={insights?.senderDiversity?.uniqueSenders?.toLocaleString() || '0'}
          subtitle={`${insights?.senderDiversity?.averageEmailsPerSender || 0} emails/sender`}
          color="#0e7490"
        />
        <MetricCard
          title="This Month"
          value={insights?.monthlyTrend?.thisMonth?.toLocaleString() || '0'}
          subtitle={
            insights?.monthlyTrend?.trend === 'up'
              ? `↑ ${Math.abs(insights.monthlyTrend.percentChange)}% vs last month`
              : insights?.monthlyTrend?.trend === 'down'
              ? `↓ ${Math.abs(insights.monthlyTrend.percentChange)}% vs last month`
              : `→ Same as last month`
          }
          color={
            insights?.monthlyTrend?.trend === 'up'
              ? '#10b981'
              : insights?.monthlyTrend?.trend === 'down'
              ? '#ef4444'
              : '#6b7280'
          }
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {insights?.emailsByDay && (
          <EmailVolumeChart emailsByDay={insights.emailsByDay} />
        )}

        {insights?.bucketBreakdown && insights.bucketBreakdown.length > 0 && (
          <BucketBreakdownChart buckets={insights.bucketBreakdown} />
        )}

        {insights?.topSenders && insights.topSenders.length > 0 && (
          <TopSendersList senders={insights.topSenders} />
        )}

        {insights?.busiestHours && insights.busiestHours.length > 0 && (
          <BusiestHoursChart hours={insights.busiestHours} />
        )}

        {insights?.busiestDays && insights.busiestDays.length > 0 && (
          <BusiestDaysChart days={insights.busiestDays} />
        )}

        {insights?.timeDistribution && (
          <TimeDistributionChart distribution={insights.timeDistribution} />
        )}
      </div>

      {/* Email Length Distribution */}
      {insights?.emailLengthDistribution && (
        <div className="glass-dark" style={{
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '1.5rem'
          }}>
            Email Length Distribution
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#06b6d4',
                marginBottom: '0.5rem'
              }}>
                {insights.emailLengthDistribution.short}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Short (&lt; 100 chars)
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(8, 145, 178, 0.1)',
              border: '1px solid rgba(8, 145, 178, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#0891b2',
                marginBottom: '0.5rem'
              }}>
                {insights.emailLengthDistribution.medium}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Medium (100-500 chars)
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(14, 116, 144, 0.1)',
              border: '1px solid rgba(14, 116, 144, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#0e7490',
                marginBottom: '0.5rem'
              }}>
                {insights.emailLengthDistribution.long}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Long (&gt; 500 chars)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Info */}
      {insights?.oldestEmail && insights?.newestEmail && (
        <div className="glass" style={{
          marginTop: '1.5rem',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          Data from {new Date(insights.oldestEmail).toLocaleDateString()} to {new Date(insights.newestEmail).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
