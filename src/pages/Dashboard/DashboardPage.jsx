import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Play, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Search,
  MessageSquare,
  Bell
} from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { engagementData, activities, clips } from '../../data/dashboardData';
import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="dashboard-page-wrapper">
      <Navbar />
      
      <div className="dashboard-page">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="brand-logo">Obsidian Pro</span>
          </div>

          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <LayoutDashboard size={20} />
              <span>DASHBOARD</span>
            </a>
            <a href="#" className="nav-item">
              <BarChart3 size={20} />
              <span>ANALYTICS</span>
            </a>
            <a href="#" className="nav-item">
              <FileText size={20} />
              <span>PROPOSALS</span>
            </a>
            <a href="#" className="nav-item">
              <Settings size={20} />
              <span>ACCOUNT SETTINGS</span>
            </a>
          </nav>

          <div className="sidebar-footer">
            <button className="create-proposal-btn">
              Create Proposal
            </button>
            
            <div className="footer-links">
              <a href="#" className="footer-link">
                <HelpCircle size={18} />
                <span>SUPPORT</span>
              </a>
              <a href="#" className="footer-link">
                <LogOut size={18} />
                <span>LOGOUT</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Internal Header (Analytics Search/User) */}
          <header className="dashboard-internal-header">
            <div className="header-search">
              <Search size={18} />
              <input type="text" placeholder="Search analytics..." />
            </div>
            <div className="header-actions">
              <button className="header-btn"><Bell size={20} /></button>
              <button className="header-btn"><MessageSquare size={20} /></button>
              <button className="header-btn"><Settings size={20} /></button>
              <div className="header-user">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="Profile" />
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            <div className="welcome-section">
              <h1>Welcome back, Architect.</h1>
              <p>Your Obsidian Pro performance is trending <span className="trending-up">+12.4%</span> this week.</p>
            </div>

            <div className="stats-grid">
              {/* Profile Engagement Chart */}
              <div className="stat-card chart-card">
                <div className="card-header">
                  <div className="label-group">
                    <span className="card-label">IMPACT ANALYSIS</span>
                    <h3>Profile Engagement</h3>
                  </div>
                  <div className="trend-badge">
                    <TrendingUp size={14} />
                    <span>24% INCREASE</span>
                  </div>
                </div>
                
                <div className="bar-chart">
                  {engagementData.map((d, i) => (
                    <div key={i} className="bar-container">
                      <div 
                        className={`bar ${i === engagementData.length - 1 ? 'highlight' : ''}`} 
                        style={{ height: `${d.value}%` }}
                      >
                        {i === engagementData.length - 1 && <div className="stars">✨</div>}
                      </div>
                      <span className="bar-day">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Proposals */}
              <div className="stat-card summary-card">
                <div className="card-header">
                  <LayoutDashboard size={24} className="icon-purple" />
                </div>
                <div className="stat-value-group">
                  <span className="card-label">TOTAL PROPOSALS</span>
                  <h2 className="big-value">142</h2>
                </div>
                <div className="trend-footer">
                  <span className="trend-plus">+8</span>
                  <span>new this month</span>
                </div>
              </div>

              {/* Video reach */}
              <div className="stat-card compact-card">
                <div className="card-header">
                  <div className="play-icon-bg"><Play size={20} fill="currentColor" /></div>
                </div>
                <div className="stat-value-group">
                   <span className="card-label">VIDEO CONTENT REACH</span>
                   <h2 className="mid-value">12.8K</h2>
                </div>
                <div className="card-footer">
                  <span className="live-badge">Live</span>
                  <span>performance tracking</span>
                </div>
              </div>

              {/* Conversion */}
              <div className="stat-card conversion-card">
                <div className="stat-value-group">
                  <span className="card-label">CONVERSION METRIC</span>
                  <h2 className="mid-value">89% Accepted</h2>
                  <p>Your proposal acceptance rate is in the top 3% of all Obsidian kinetic architects.</p>
                </div>
                <div className="circular-progress-container">
                  <div className="circular-progress" style={{ '--progress': '89%' }}>
                    <div className="progress-inner">89%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lower-grid">
              {/* Video Performance */}
              <div className="section-container">
                <div className="section-header">
                  <h2>Video Performance</h2>
                  <button className="view-all">VIEW ALL CLIPS</button>
                </div>
                <div className="videos-grid">
                  {clips.map(clip => (
                    <div key={clip.id} className="video-card">
                      <div className="video-thumb">
                        <img src={clip.thumbnail} alt={clip.title} />
                        <div className="thumb-overlay">
                          <Play size={32} fill="white" />
                        </div>
                        <span className="duration">{clip.duration}</span>
                      </div>
                      <div className="video-info">
                        <h4>{clip.title}</h4>
                        <div className="video-meta">
                          <span>👁 {clip.views}</span>
                          <span>👍 {clip.likes}</span>
                          <span className={`status-tag ${clip.status.toLowerCase()}`}>{clip.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Column */}
              <div className="side-column">
                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="actions-list">
                    <button className="action-btn-main">
                      <div className="action-icon"><Plus size={20} /></div>
                      <span>Create New Proposal</span>
                      <ChevronRight size={18} />
                    </button>
                    <button className="action-btn">
                      <FileText size={18} />
                      <span>Edit Profile</span>
                      <ChevronRight size={18} />
                    </button>
                    <button className="action-btn">
                      <Settings size={18} />
                      <span>Account Settings</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="latest-activity">
                  <h3>Latest Activity</h3>
                  <div className="activity-list">
                    {activities.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className={`activity-icon-box ${activity.status.toLowerCase()}`}>
                          {activity.status === 'ACCEPTED' && <TrendingUp size={16} />}
                          {activity.status === 'SENT' && <FileText size={16} />}
                          {activity.status === 'DRAFT' && <FileText size={16} />}
                        </div>
                        <div className="activity-details">
                          <h4>{activity.title}</h4>
                          <p>{activity.time} • {activity.project}</p>
                        </div>
                        <span className={`status-pill ${activity.status.toLowerCase()}`}>
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

