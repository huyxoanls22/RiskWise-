import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Search, 
  RotateCw, 
  UserCheck, 
  UserX, 
  Calendar, 
  Copy, 
  Check, 
  AlertTriangle, 
  X, 
  Filter, 
  Users, 
  Crown, 
  LockKeyholeOpen, 
  CalendarDays,
  Sparkles
} from 'lucide-react';

interface Profile {
  user_id: string;
  email: string | null;
  tier: 'free' | 'premium' | string;
  subscription_type: string | null;
  expires_at: string | null;
}

interface ActionState {
  type: 'renew_month' | 'renew_year' | 'revoke';
  profile: Profile;
}

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal operation states
  const [actionConfirm, setActionConfirm] = useState<ActionState | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error', text: string } | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, tier, subscription_type, expires_at')
        .order('email', { ascending: true });

      if (error) {
        throw error;
      }
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      showFeedback('error', 'Không thể tải danh sách tài khoản: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const showFeedback = (status: 'success' | 'error', text: string) => {
    setFeedback({ status, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Define calculations for specific action
  const handleConfirmAction = async () => {
    if (!actionConfirm) return;

    const { type, profile } = actionConfirm;
    setActionInProgress(true);

    try {
      let updatedFields: Partial<Profile> = {};
      const now = new Date();

      const nowMs = Date.now();

      if (type === 'renew_month') {
        // Cộng chuẩn 30 ngày (30 * 24 * 60 * 60 * 1000 ms) kể từ mốc thời gian hiện tại chuẩn UTC
        const expiryDate = new Date(nowMs + 30 * 24 * 60 * 60 * 1000);
        updatedFields = {
          tier: 'premium',
          subscription_type: 'monthly',
          expires_at: expiryDate.toISOString()
        };
      } else if (type === 'renew_year') {
        // Cộng chuẩn 365 ngày (365 * 24 * 60 * 60 * 1000 ms) kể từ mốc thời gian hiện tại chuẩn UTC
        const expiryDate = new Date(nowMs + 365 * 24 * 60 * 60 * 1000);
        updatedFields = {
          tier: 'premium',
          subscription_type: 'annual',
          expires_at: expiryDate.toISOString()
        };
      } else if (type === 'revoke') {
        updatedFields = {
          tier: 'free',
          subscription_type: null,
          expires_at: null
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      showFeedback(
        'success', 
        type === 'revoke' 
          ? `Đã thu hồi quyền của ${profile.email || 'User'}` 
          : `Gia hạn thành công cho ${profile.email || 'User'}`
      );

      // Refresh component list state locally to avoid full fetch layout flickers
      setProfiles(prev => 
        prev.map(p => p.user_id === profile.user_id ? { ...p, ...updatedFields } : p)
      );

    } catch (err: any) {
      console.error('Error calling update tier:', err);
      showFeedback('error', 'Thất bại: ' + err.message);
    } finally {
      setActionConfirm(null);
      setActionInProgress(false);
    }
  };

  // Pre-process list filtering/searching
  const filteredProfiles = profiles.filter(p => {
    const emailStr = (p.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = emailStr.includes(query) || p.user_id.toLowerCase().includes(query);
    
    if (tierFilter === 'all') return matchesSearch;
    return matchesSearch && p.tier === tierFilter;
  });

  // Calculate statistics
  const totalUsers = profiles.length;
  const premiumUsers = profiles.filter(p => p.tier === 'premium').length;
  const freeUsers = totalUsers - premiumUsers;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'vĩnh viễn';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getActionTitle = (type: 'renew_month' | 'renew_year' | 'revoke') => {
    switch (type) {
      case 'renew_month': return 'Gia hạn Tháng';
      case 'renew_year': return 'Gia hạn Năm';
      case 'revoke': return 'Thu hồi quyền';
    }
  };

  const getActionColorClass = (type: 'renew_month' | 'renew_year' | 'revoke') => {
    switch (type) {
      case 'renew_month': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30';
      case 'renew_year': return 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30';
      case 'revoke': return 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30';
    }
  };

  return (
    <div className="w-full space-y-6" id="admin-dashboard-container">
      {/* Upper Status & Feedback */}
      {feedback && (
        <div 
          id="admin-alert-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-slideUp ${
            feedback.status === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-900/10' 
              : 'bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-900/10'
          }`}
        >
          {feedback.status === 'success' ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
          )}
          <span className="text-xs font-semibold tracking-wide leading-tight">{feedback.text}</span>
        </div>
      )}

      {/* Admin Title & Summary Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-tight">
                Hệ Thống Phân Quyền
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Kiểm soát, điều phối hạn mức và gia hạn gói Premium cho học viên / người dùng ứng dụng.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={refreshData}
          disabled={loading || refreshing}
          className="self-start md:self-auto px-3.5 py-2 text-xs font-bold text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-xl border border-slate-750 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98 disabled:opacity-50"
          id="btn-admin-refresh"
        >
          <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
          Sắp xếp / Làm mới
        </button>
      </div>

      {/* Grid count summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-bento-grid">
        <div className="bg-[#14171F] border border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-slate-850 text-indigo-400 rounded-xl border border-slate-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Tổng User Đăng Ký</span>
            <div className="text-lg font-black text-slate-100 mt-0.5 font-mono">{loading ? '...' : totalUsers}</div>
          </div>
        </div>

        <div className="bg-[#14171F] border border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Premium Active</span>
            <div className="text-lg font-black text-yellow-400 mt-0.5 font-mono">{loading ? '...' : premiumUsers}</div>
          </div>
        </div>

        <div className="bg-[#14171F] border border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-slate-850 text-slate-400 rounded-xl border border-slate-800">
            <LockKeyholeOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Bản Free thường</span>
            <div className="text-lg font-black text-slate-350 mt-0.5 font-mono">{loading ? '...' : freeUsers}</div>
          </div>
        </div>
      </div>

      {/* Primary Table Segment Card */}
      <div className="bg-[#14171F] border border-slate-800/85 rounded-2xl overflow-hidden shadow-xs" id="admin-table-container">
        
        {/* Filter bar and search */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-200 bg-[#0B0E14] border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-505 placeholder-slate-500 transition-all"
              id="admin-search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-[#0B0E14] border border-slate-800 rounded-xl p-1 shrink-0">
            <div className="px-2 text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Gói</span>
            </div>
            <button
              onClick={() => setTierFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tierFilter === 'all' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTierFilter('premium')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tierFilter === 'premium' 
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Premium
            </button>
            <button
              onClick={() => setTierFilter('free')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tierFilter === 'free' 
                  ? 'bg-slate-800 text-slate-300 border border-slate-750' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Free
            </button>
          </div>
        </div>

        {/* Dynamic Table Loader Panel */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <RotateCw className="w-7 h-7 text-indigo-550 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải cơ sở dữ liệu học viên...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
            <LockKeyholeOpen className="w-8 h-8 text-slate-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Không tìm thấy tài khoản thích hợp</p>
            <p className="text-[11px] text-slate-500">Giải thích: Hãy đổi từ khóa hoặc tìm bộ lọc khác của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="admin-main-table">
              <thead>
                <tr className="bg-[#0B0E14]/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-4 sm:px-6">Thông tin học viên</th>
                  <th className="py-3.5 px-4">Trạng thái (Tier)</th>
                  <th className="py-3.5 px-4">Gói dịch vụ</th>
                  <th className="py-3.5 px-4">Thời Hạn Kích Hoạt</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Điều khiển phân quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredProfiles.map((p, index) => {
                  const isPremium = p.tier === 'premium';
                  const isExpired = p.expires_at ? new Date(p.expires_at).getTime() < Date.now() : false;
                  
                  return (
                    <tr 
                      key={p.user_id} 
                      className={`hover:bg-[#1a1e29]/40 transition-colors ${
                        index % 2 === 0 ? 'bg-transparent' : 'bg-[#0B0E14]/15'
                      }`}
                    >
                      {/* Customer info column */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col space-y-1 max-w-[240px] sm:max-w-xs md:max-w-sm">
                          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate block">
                            {p.email || 'Học viên ẩn danh'}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <span className="truncate max-w-[120px]">{p.user_id}</span>
                            <button
                              onClick={() => handleCopy(p.user_id)}
                              className="p-1 text-slate-500 hover:text-slate-350 transition-colors"
                              title="Sao chép User ID"
                            >
                              {copiedId === p.user_id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-450" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Tier representation column */}
                      <td className="py-4 px-4">
                        {isPremium ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 uppercase tracking-wide">
                            <Crown className="w-3 h-3" />
                            <span>Premium</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-750 uppercase tracking-wide">
                            <span>Free Client</span>
                          </div>
                        )}
                      </td>

                      {/* Subscription cycle type column */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-slate-300 font-mono uppercase">
                          {p.subscription_type === 'annual' ? (
                            <span className="text-amber-400">Gói Năm</span>
                          ) : p.subscription_type === 'monthly' ? (
                            <span className="text-indigo-400">Gói Tháng</span>
                          ) : (
                            <span className="text-slate-500 font-sans">-</span>
                          )}
                        </span>
                      </td>

                      {/* Date details and alerts */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-350">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{formatDate(p.expires_at)}</span>
                          </div>
                          {p.expires_at && isExpired && (
                            <span className="text-[10px] text-rose-405 font-bold uppercase tracking-wider pl-5">
                              Hết hạn truy cập
                            </span>
                          )}
                          {p.expires_at && !isExpired && (
                            <span className="text-[9px] text-emerald-455 font-semibold pl-5">
                              Đang có hiệu lực
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action trigger columns */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2" id={`actions-for-${p.user_id}`}>
                          
                          {/* Green Button: Gia hạn Tháng */}
                          <button
                            onClick={() => setActionConfirm({ type: 'renew_month', profile: p })}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/20 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                            title="Có hiệu lực kéo dài 30 ngày từ ngày gia hạn"
                          >
                            +Tháng
                          </button>

                          {/* Yellow Button: Gia hạn Năm */}
                          <button
                            onClick={() => setActionConfirm({ type: 'renew_year', profile: p })}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/20 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                            title="Có hiệu lực kéo dài 365 ngày từ ngày gia hạn"
                          >
                            +Năm
                          </button>

                          {/* Red Button: Thu hồi quyên */}
                          <button
                            onClick={() => setActionConfirm({ type: 'revoke', profile: p })}
                            disabled={p.tier === 'free'}
                            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                              p.tier === 'free'
                                ? 'opacity-30 cursor-not-allowed border border-transparent text-slate-600 bg-transparent'
                                : 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 cursor-pointer'
                            }`}
                            title="Cắt quyền premium, trả về gói Free và mốc thời gian null"
                          >
                            Thu hồi
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal - Security Mechanism */}
      {actionConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
          id="confirm-action-modal"
        >
          <div className="bg-[#14171F] border border-slate-800 max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scaleUp">
            
            {/* Modal header accent based on action type */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              actionConfirm.type === 'revoke' ? 'bg-rose-505' : 'bg-[#7C3AED]'
            }`} />

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border shrink-0 ${
                actionConfirm.type === 'revoke' 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/25' 
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
              }`}>
                {actionConfirm.type === 'revoke' ? (
                  <UserX className="w-6 h-6" />
                ) : (
                  <UserCheck className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-slate-100 font-extrabold text-base tracking-tight uppercase">
                  Xác nhận: {getActionTitle(actionConfirm.type)}
                </h3>
                <p className="text-xs text-slate-400">
                  Hệ thống kiểm duyệt an toàn phân quyền quản trị Admin.
                </p>
              </div>
            </div>

            {/* Prompt exact text requested */}
            <div className="mt-5 p-4 bg-[#0B0E14] rounded-xl border border-slate-800/80 text-[13px] leading-relaxed text-slate-205">
              Bạn có chắc chắn thao tác với email <span className="text-indigo-400 font-sans font-extrabold underline decoration-indigo-550/50 decoration-2 underline-offset-2">{actionConfirm.profile.email || 'ẩn danh'}</span> không?
            </div>

            <div className="mt-4 text-xs text-slate-400 flex flex-col space-y-1 bg-slate-900/10 p-3 rounded-lg border border-slate-850/60 font-mono">
              <div className="flex justify-between">
                <span>ID Học Viên:</span>
                <span className="text-slate-300">{actionConfirm.profile.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Thao tác:</span>
                <span className={`font-semibold ${actionConfirm.type === 'revoke' ? 'text-rose-400' : 'text-emerald-450'}`}>
                  {getActionTitle(actionConfirm.type).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hạn mới khuyên dùng:</span>
                <span className="text-slate-300">
                  {actionConfirm.type === 'renew_month' ? 'Cộng thêm 30 ngày' : actionConfirm.type === 'renew_year' ? 'Cộng thêm 365 ngày' : 'Thu hồi hết hạn'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer select-none disabled:opacity-50"
                id="btn-confirm-cancel"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionInProgress}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-md cursor-pointer select-none flex items-center gap-1.5 active:scale-97 ${
                  actionConfirm.type === 'revoke' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' 
                    : actionConfirm.type === 'renew_year'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-950/10'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                }`}
                id="btn-confirm-submit"
              >
                {actionInProgress ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-current" />
                ) : null}
                <span>Đồng ý</span>
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
