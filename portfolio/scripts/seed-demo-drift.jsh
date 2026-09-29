import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.List;
import java.util.Properties;

var properties = new Properties();
try (var input = Files.newInputStream(Path.of("Portfolio-management-System/portfolio/src/main/resources/application.properties"))) {
    properties.load(input);
}

var connection = DriverManager.getConnection(
        properties.getProperty("spring.datasource.url"),
        properties.getProperty("spring.datasource.username"),
        properties.getProperty("spring.datasource.password"));
connection.setAutoCommit(false);
var statementsRun = 0;
try {
    var seedFiles = List.of(
            "Portfolio-management-System/portfolio/src/main/resources/demo-drift-one-year.sql",
            "Portfolio-management-System/portfolio/src/main/resources/demo-drift-portfolio.sql");
    for (var seedFile : seedFiles) {
        var seed = Files.readString(Path.of(seedFile));
        for (var sql : seed.split(";")) {
            if (!sql.isBlank()) {
                try (var statement = connection.createStatement()) {
                    statement.execute(sql);
                    statementsRun++;
                }
            }
        }
    }
    connection.commit();
    System.out.println("Demo drift history seeded; SQL statements run: " + statementsRun);
} catch (Exception error) {
    connection.rollback();
    throw error;
} finally {
    connection.close();
}
/exit