using FlatFinder.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FlatFinder.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Flat> Flats => Set<Flat>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<SearchHistory> SearchHistories => Set<SearchHistory>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Flat>(e =>
        {
            e.HasIndex(x => x.LocationArea);
            e.HasIndex(x => x.PriceMonthly);
            e.HasIndex(x => new { x.City, x.IsActive });
            e.Property(x => x.PriceMonthly).HasPrecision(18, 2);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<UserPreference>(e =>
        {
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.MinPrice).HasPrecision(18, 2);
            e.Property(x => x.MaxPrice).HasPrecision(18, 2);
        });

        builder.Entity<SearchHistory>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.SearchedAt });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.MinPrice).HasPrecision(18, 2);
            e.Property(x => x.MaxPrice).HasPrecision(18, 2);
        });

        builder.Entity<Favorite>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.FlatId }).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Flat).WithMany().HasForeignKey(x => x.FlatId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Message>(e =>
        {
            e.HasIndex(x => new { x.ReceiverId, x.IsRead });
            e.HasOne(x => x.Sender).WithMany().HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.Receiver).WithMany().HasForeignKey(x => x.ReceiverId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Flat).WithMany().HasForeignKey(x => x.FlatId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
