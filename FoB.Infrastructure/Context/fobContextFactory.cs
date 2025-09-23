using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System;
using FoB.Infrastructure.Context;

public class fobContextFactory : IDesignTimeDbContextFactory<fobContext>
{
    public fobContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<fobContext>();

        optionsBuilder.UseMySql("server=26.30.204.130;Port=3306;database=fob;uid=pibes;pwd=mySqlProyecto2025*;", new MySqlServerVersion(new Version(8, 0, 21)));
        // "server=127.0.0.1;Port=3306;database=fob;uid=root;pwd=1234;"
        return new fobContext(optionsBuilder.Options);
    }
}