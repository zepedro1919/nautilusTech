function calculateMaintenanceScore (unresolvedCount, avgResponseTime) {
    if (unresolvedCount > 0) return "D";
    
    if (avgResponseTime <= 600) return "A+";
    if (avgResponseTime <= 1800) return "A";
    if (avgResponseTime <= 3600) return "A-";
    if (avgResponseTime <= 7200) return "B+";
    if (avgResponseTime <= 14400) return "B";
    if (avgResponseTime <= 28800) return "B-";
    if (avgResponseTime <= 57600) return "C+";
    if (avgResponseTime <= 115200) return "C";
    if (avgResponseTime <= 230400) return "C-";
    if (avgResponseTime <= 460800) return "D+";
    if (avgResponseTime <= 921600) return "D";
    return "D-";
}