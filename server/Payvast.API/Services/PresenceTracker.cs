using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Payvast.API.Services
{
    public class PresenceTracker
    {
        // === شروع تغییرات: تغییر کلید از string به int برای UserId ===
        private static readonly Dictionary<int, List<string>> OnlineUsers = 
            new Dictionary<int, List<string>>();

        public Task<bool> UserConnected(int userId, string connectionId)
        {
            bool isOnline = false;
            lock (OnlineUsers)
            {
                if (!OnlineUsers.ContainsKey(userId))
                {
                    OnlineUsers.Add(userId, new List<string> { connectionId });
                    isOnline = true;
                }
                else
                {
                    OnlineUsers[userId].Add(connectionId);
                }
            }
            return Task.FromResult(isOnline);
        }

        public Task<bool> UserDisconnected(int userId, string connectionId)
        {
            bool isOffline = false;
            lock (OnlineUsers)
            {
                if (!OnlineUsers.ContainsKey(userId)) return Task.FromResult(isOffline);

                OnlineUsers[userId].Remove(connectionId);
                
                if (OnlineUsers[userId].Count == 0)
                {
                    OnlineUsers.Remove(userId);
                    isOffline = true;
                }
            }
            return Task.FromResult(isOffline);
        }

        public Task<int[]> GetOnlineUserIds()
        {
            int[] onlineUserIds;
            lock (OnlineUsers)
            {
                onlineUserIds = OnlineUsers.Keys.ToArray();
            }
            return Task.FromResult(onlineUserIds);
        }
        // === پایان تغییرات ===
    }
}