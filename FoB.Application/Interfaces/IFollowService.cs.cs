using System.Threading.Tasks;

namespace FoB.Application.Interface
{
    public interface IFollowService
    {
        Task<bool> FollowUserAsync(int followerId, int followedId);
        Task<bool> UnfollowUserAsync(int followerId, int followedId);
        Task<bool> IsFollowingAsync(int followerId, int followedId);
    }
}