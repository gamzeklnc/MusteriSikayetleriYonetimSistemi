using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Application.Services;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Infrastructure.Repositories;
using ComplaintsAPI.Infrastructure.Services;

using DotNetEnv;

Env.Load(".env.local");

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ─────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();


// 🔥 DEBUG (EN ÖNEMLİ)
Console.WriteLine("ENVIRONMENT: " + builder.Environment.EnvironmentName);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine("CONNECTION STRING: " + connectionString);


// ── Database ────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));


// ── JWT ────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key bulunamadı.");

Console.WriteLine("JWT KEY: " + jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

builder.Services.AddAuthorization();


// ── DI ─────────────────────────────────────────────────
builder.Services.AddScoped<IComplaintRepository, ComplaintRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailSmtpService>();


// ── Controllers ─────────────────────────────────────────
builder.Services.AddControllers();


// ── Swagger ────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Müşteri Şikayetleri API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Bearer token gir",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


// ── CORS ───────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalNetworkPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin();
    });
});


// ── APP ────────────────────────────────────────────────
var app = builder.Build();

try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.SetCommandTimeout(10); // 10 saniye timeout
    db.Database.ExecuteSqlRaw(@"
IF COL_LENGTH('dbo.ComplaintBarcodeResults', 'Factory') IS NULL
BEGIN
    ALTER TABLE dbo.ComplaintBarcodeResults ADD Factory nvarchar(20) NULL;
END

IF OBJECT_ID('dbo.__EFMigrationsHistory') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM dbo.__EFMigrationsHistory
       WHERE MigrationId = '20260421120000_AddFactoryToBarcodeResults'
   )
BEGIN
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20260421120000_AddFactoryToBarcodeResults', '8.0.0');
END
");
    Console.WriteLine("Startup SQL: başarılı.");
}
catch (Exception ex)
{
    Console.WriteLine($"Startup SQL atlandı (DB erişilemiyor): {ex.Message}");
}

Console.WriteLine("[STARTUP] Middleware kayıt başlıyor...");
// 🔥 SWAGGER ROOT
app.UseSwagger();
Console.WriteLine("[STARTUP] UseSwagger OK");
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ComplaintsAPI v1");
    c.RoutePrefix = ""; // root
});
Console.WriteLine("[STARTUP] UseSwaggerUI OK");

// ── Middleware ─────────────────────────────────────────
app.UseSerilogRequestLogging();
Console.WriteLine("[STARTUP] UseSerilog OK");
app.UseStaticFiles();
Console.WriteLine("[STARTUP] UseStaticFiles OK");
app.UseCors("LocalNetworkPolicy");
Console.WriteLine("[STARTUP] UseCors OK");

app.UseAuthentication();
Console.WriteLine("[STARTUP] UseAuthentication OK");
app.UseAuthorization();
Console.WriteLine("[STARTUP] UseAuthorization OK");

app.MapControllers();
Console.WriteLine("[STARTUP] MapControllers OK");

app.MapGet("/", () => "API çalışıyor 🚀");

Console.WriteLine("[STARTUP] app.Run() çağrılıyor...");
app.Run();
