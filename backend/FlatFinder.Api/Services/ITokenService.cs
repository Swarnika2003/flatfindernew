using FlatFinder.Api.Models;

namespace FlatFinder.Api.Services;

public interface ITokenService
{
    string CreateToken(ApplicationUser user);
}
