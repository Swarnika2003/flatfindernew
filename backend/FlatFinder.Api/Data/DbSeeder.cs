using FlatFinder.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FlatFinder.Api.Data;

public static class DbSeeder
{
    private const int MinimumKathmanduListings = 60;

    private static readonly (string Area, string Title, decimal Price, int Rooms, int? Sq)[] KathmanduSamples =
    [
        ("Thamel", "Bright 2BR near Garden of Dreams", 28000, 2, 55),
        ("Thamel", "Studio walk-up — quiet lane", 15000, 1, 28),
        ("Lazimpat", "Family 3BR with parking", 55000, 3, 95),
        ("Lazimpat", "Modern 2BR serviced flat", 42000, 2, 68),
        ("Baneshwor", "Affordable 2BR close to colleges", 22000, 2, 52),
        ("Baneshwor", "1BR furnished — short walk to ring road", 18000, 1, 35),
        ("Patan (Lalitpur)", "Heritage courtyard 2BR", 31000, 2, 60),
        ("Patan (Lalitpur)", "New build 3BR — Pulchowk", 48000, 3, 88),
        ("Boudha", "Rooftop view 2BR near stupa", 26000, 2, 58),
        ("Boudha", "Budget 1BR — monastery road", 14000, 1, 30),
        ("Jawalakhel", "Spacious 3BR near zoo", 45000, 3, 90),
        ("Jawalakhel", "2BR with small garden", 38000, 2, 72),
        ("Baluwatar", "Executive 3BR — gated", 75000, 3, 120),
        ("Baluwatar", "2BR high floor — city view", 52000, 2, 78),
        ("Kumaripati", "2BR close to shops", 35000, 2, 62),
        ("Sanepa", "Quiet 2BR expat-friendly", 40000, 2, 65),
        ("Tripureshwor", "Central 1BR — hospital proximity", 19000, 1, 32),
        ("Kalimati", "2BR ring-road access", 24000, 2, 50),
        ("Kalanki", "Value 3BR for families", 30000, 3, 80),
        ("Maharajgunj", "Near hospital 2BR", 36000, 2, 64),
        ("Sinamangal", "Airport road 2BR", 27000, 2, 54),
        ("Gongabu", "New town 2BR", 23000, 2, 48),
        ("Tokha", "Hillside 2BR — cooler nights", 21000, 2, 56),
        ("Kirtipur", "Hilltop 2BR — valley view", 20000, 2, 58),
        ("Bhaktapur (short commute)", "Peaceful 2BR — heritage town", 25000, 2, 60)
    ];

    public static async Task SeedAsync(AppDbContext db, UserManager<ApplicationUser> users, bool isDevelopment)
    {
        // Create test users if they don't exist
        var user1 = await users.FindByEmailAsync("owner1@flatfinder.local");
        if (user1 == null)
        {
            user1 = new ApplicationUser
            {
                UserName = "owner1@flatfinder.local",
                Email = "owner1@flatfinder.local",
                EmailConfirmed = true,
                DisplayName = "Rajesh Sharma"
            };
            await users.CreateAsync(user1, "Owner123!");
        }

        var user2 = await users.FindByEmailAsync("owner2@flatfinder.local");
        if (user2 == null)
        {
            user2 = new ApplicationUser
            {
                UserName = "owner2@flatfinder.local",
                Email = "owner2@flatfinder.local",
                EmailConfirmed = true,
                DisplayName = "Priya Poudel"
            };
            await users.CreateAsync(user2, "Owner123!");
        }

        var demoUser = await users.FindByEmailAsync("demo@flatfinder.local");
        if (demoUser == null)
        {
            demoUser = new ApplicationUser
            {
                UserName = "demo@flatfinder.local",
                Email = "demo@flatfinder.local",
                EmailConfirmed = true,
                DisplayName = "Demo Explorer"
            };
            await users.CreateAsync(demoUser, "Demo123!");
        }

        var kathmanduCount = await db.Flats.CountAsync(f => f.City == "Kathmandu");
        if (kathmanduCount < MinimumKathmanduListings)
        {
            var rng = new Random(42);
            var list = new List<Flat>();
            var existingKathmanduKeys = await db.Flats.AsNoTracking()
                .Where(f => f.City == "Kathmandu")
                .Select(f => new { f.Title, f.LocationArea })
                .ToListAsync();
            var existingSet = existingKathmanduKeys.Select(x => (x.Title, x.LocationArea)).ToHashSet();

            // Assign some flats to user1 and user2
            var userFlatsCount = 0;
            foreach (var (area, title, price, rooms, sq) in KathmanduSamples)
            {
                if (existingSet.Contains((title, area)))
                    continue;

                var assignedUserId = userFlatsCount % 2 == 0 ? user1.Id : user2.Id;
                list.Add(new Flat
                {
                    UserId = assignedUserId,
                    Title = title,
                    Description = $"Well-maintained flat in {area}, Kathmandu Valley. Utilities negotiable; deposit typically 1–2 months.",
                    LocationArea = area,
                    City = "Kathmandu",
                    PriceMonthly = price + rng.Next(-2000, 4000),
                    Rooms = rooms,
                    AreaSqM = sq,
                    IsActive = true,
                    ListedAt = DateTimeOffset.UtcNow.AddDays(-rng.Next(1, 120))
                });
                userFlatsCount++;
            }

            // Ensure enough Kathmandu inventory for pagination and recommendations.
            var areas = new[] { "Thamel", "Patan (Lalitpur)", "Baneshwor", "Boudha", "Lazimpat", "Jawalakhel" };
            var targetAdditionalCount = Math.Max(0, MinimumKathmanduListings - (kathmanduCount + list.Count));
            for (var i = 0; i < targetAdditionalCount; i++)
            {
                var a = areas[i % areas.Length];
                var assignedUserId = i % 2 == 0 ? user1.Id : user2.Id;
                list.Add(new Flat
                {
                    UserId = assignedUserId,
                    Title = $"Kathmandu Listing #{100 + i} — {a}",
                    Description = $"Sample rental in {a}, Kathmandu for development and demo flows.",
                    LocationArea = a,
                    City = "Kathmandu",
                    PriceMonthly = 12000 + (i * 800) % 50000,
                    Rooms = 1 + (i % 3),
                    AreaSqM = 30 + (i * 3) % 70,
                    IsActive = true,
                    ListedAt = DateTimeOffset.UtcNow.AddHours(-i)
                });
            }

            if (list.Count > 0)
            {
                db.Flats.AddRange(list);
                await db.SaveChangesAsync();
            }
        }
    }
}
