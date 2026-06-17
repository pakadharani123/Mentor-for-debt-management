const PDFDocument = require('pdfkit');

/**
 * PDF Report Generation Service
 * Generates custom structured PDF reports summarizing the user's financial health, debt strategies, and AI suggestions.
 */
class PDFReportService {
  /**
   * Generates financial report and streams it to the client
   * @param {Object} data - Aggregate data including user, profile, dashboard, plans, health, and AI advice
   * @param {Object} res - Express response stream
   */
  static generateReport(data, res) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Debt Management & Financial Guidance Report',
        Author: 'Antigravity Financial Platform',
        Subject: 'Financial Analysis'
      }
    });

    // Pipe doc to response
    doc.pipe(res);

    // Color definitions
    const primaryColor = '#1A365D'; // Navy
    const secondaryColor = '#2B6CB0'; // Slate Blue
    const darkTextColor = '#2D3748';
    const lightGray = '#EDF2F7';
    
    // Risk status colors
    const colorHealthy = '#38A169';
    const colorModerate = '#DD6B20';
    const colorHigh = '#E53E3E';

    let healthColor = colorHealthy;
    if (data.health.rating === 'Moderate Risk') {
      healthColor = colorModerate;
    } else if (data.health.rating === 'High Risk') {
      healthColor = colorHigh;
    }

    // --- PAGE 1: TITLE & FINANCIAL DASHBOARD ---
    // Header block
    doc.rect(0, 0, 595.28, 110)
       .fill(primaryColor);
    
    doc.fillColor('#FFFFFF')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('DEBT MANAGEMENT & GUIDANCE', 50, 35)
       .fontSize(12)
       .font('Helvetica')
       .text('Personalized Financial Health Analysis Report', 50, 65);

    // Date & User Details
    doc.fillColor(darkTextColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Date:', 50, 130)
       .font('Helvetica')
       .text(new Date().toLocaleDateString(), 120, 130)
       .font('Helvetica-Bold')
       .text('Client Name:', 50, 145)
       .font('Helvetica')
       .text(data.user.name, 120, 145)
       .font('Helvetica-Bold')
       .text('Preferred Lang:', 50, 160)
       .font('Helvetica')
       .text(data.user.preferredLanguage.toUpperCase(), 120, 160);

    // Horizontal Line
    doc.moveTo(50, 180).lineTo(545, 180).strokeColor(lightGray).lineWidth(1).stroke();

    // Section 1: Financial Profile Overview
    doc.fillColor(secondaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('1. Financial Dashboard Overview', 50, 195);

    // Draw Metrics Grid
    const gridY = 220;
    const col1X = 50;
    const col2X = 300;

    const metrics = [
      { label: 'Monthly Income', val: `Rs. ${data.dashboard.monthlyIncome.toLocaleString()}` },
      { label: 'Monthly Expenses', val: `Rs. ${data.dashboard.monthlyExpenses.toLocaleString()}` },
      { label: 'Total EMI commitment', val: `Rs. ${data.dashboard.totalEMI.toLocaleString()}` },
      { label: 'Monthly Surplus', val: `Rs. ${data.dashboard.availableMonthlySurplus.toLocaleString()}` },
      { label: 'Total Outstanding Debt', val: `Rs. ${data.dashboard.totalDebt.toLocaleString()}` },
      { label: 'Total Active Loans', val: `${data.dashboard.totalLoans}` },
      { label: 'Savings Balance', val: `Rs. ${data.dashboard.savings.toLocaleString()}` },
      { label: 'Debt-to-Income Ratio', val: `${data.dashboard.debtToIncomeRatio.toFixed(1)}%` }
    ];

    doc.font('Helvetica').fontSize(10).fillColor(darkTextColor);
    
    metrics.forEach((m, idx) => {
      const isEven = idx % 2 === 0;
      const x = isEven ? col1X : col2X;
      const y = gridY + Math.floor(idx / 2) * 35;
      
      // Draw background box
      doc.rect(x, y, 230, 28).fill(lightGray);
      doc.fillColor(darkTextColor)
         .font('Helvetica')
         .text(m.label, x + 10, y + 9)
         .font('Helvetica-Bold')
         .text(m.val, x + 130, y + 9, { align: 'right', width: 90 });
    });

    // Section 2: Financial Health Card
    const healthY = 380;
    doc.fillColor(secondaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('2. Financial Health Risk Assessment', 50, healthY);

    // Border Box for Health Score
    doc.rect(50, healthY + 20, 495, 80)
       .strokeColor(healthColor)
       .lineWidth(2)
       .stroke();

    // Fill Score
    doc.fillColor(healthColor)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(data.health.score.toString(), 80, healthY + 38)
       .fontSize(10)
       .font('Helvetica')
       .text('/ 100 Risk Score', 80, healthY + 70);

    // Status & Text
    doc.fillColor(darkTextColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(`Status: ${data.health.rating}`, 200, healthY + 35)
       .fontSize(9.5)
       .font('Helvetica')
       .fillColor('#555555')
       .text(
         data.health.score <= 30
           ? "You have a solid financial status. Keep budgeting carefully and maintain healthy credit habits."
           : data.health.score <= 60
           ? "You are exhibiting moderate financial risk. Take prompt actions to curb debt accumulation and expand your savings."
           : "Warning: High financial risk. Your debts require immediate management and consolidation attention to avoid compounding liabilities.",
         200,
         healthY + 55,
         { width: 330 }
       );

    // Add Page Footer
    doc.fontSize(8)
       .fillColor('#A0AEC0')
       .text('Generated by AI Debt Guidance Platform - Page 1 of 2', 50, 770, { align: 'center' });

    // --- PAGE 2: DEBT STRATEGY COMPARISON & AI GUIDANCE ---
    doc.addPage();

    // Top Header bar for page 2
    doc.rect(0, 0, 595.28, 20).fill(primaryColor);

    doc.fillColor(secondaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('3. Debt Repayment Strategy Analysis', 50, 40);

    // Intro sentence
    doc.fillColor(darkTextColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Using your available monthly surplus of Rs. ${data.dashboard.availableMonthlySurplus.toLocaleString()} alongside active debt details, the engine calculated two optimization methodologies.`, 50, 60, { width: 495 });

    // Strategy Tables
    const strategyTableY = 95;
    
    // Column headers
    doc.rect(50, strategyTableY, 495, 20).fill(primaryColor);
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(9)
       .text('Strategy Name', 60, strategyTableY + 6)
       .text('Repayment Duration', 200, strategyTableY + 6)
       .text('Total Interest Cost', 380, strategyTableY + 6);

    // Row 1 (Snowball)
    doc.rect(50, strategyTableY + 20, 495, 22).fill(lightGray);
    doc.fillColor(darkTextColor)
       .font('Helvetica')
       .text('Debt Snowball (Smallest balance first)', 60, strategyTableY + 27)
       .text(`${data.plans.snowballPlan.totalMonths} Months`, 200, strategyTableY + 27)
       .text(`Rs. ${data.plans.snowballPlan.totalInterestPaid.toLocaleString()}`, 380, strategyTableY + 27);

    // Row 2 (Avalanche)
    doc.rect(50, strategyTableY + 42, 495, 22).fill('#FFFFFF');
    doc.fillColor(darkTextColor)
       .font('Helvetica')
       .text('Debt Avalanche (Highest rate first)', 60, strategyTableY + 49)
       .text(`${data.plans.avalanchePlan.totalMonths} Months`, 200, strategyTableY + 49)
       .text(`Rs. ${data.plans.avalanchePlan.totalInterestPaid.toLocaleString()}`, 380, strategyTableY + 49);

    // Recommendation summary
    doc.rect(50, strategyTableY + 75, 495, 45).fill('#EBF8FF');
    doc.fillColor('#2B6CB0')
       .font('Helvetica-Bold')
       .text(`Recommendation: ${data.plans.recommendedStrategy}`, 60, strategyTableY + 83)
       .fillColor(darkTextColor)
       .font('Helvetica')
       .fontSize(8.5)
       .text(data.plans.recommendationReason, 60, strategyTableY + 97, { width: 475 });

    // Section 4: AI Advisor Guidance & Action Items
    const aiGuidanceY = 245;
    doc.fillColor(secondaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('4. Personalized Advisor Guidance', 50, aiGuidanceY);

    // Summary text
    doc.fillColor(darkTextColor)
       .fontSize(9.5)
       .font('Helvetica-Bold')
       .text('Summary:', 50, aiGuidanceY + 22)
       .font('Helvetica')
       .text(data.aiAdvice.summary, 50, aiGuidanceY + 35, { width: 495 });

    // Recommendations list
    let listY = aiGuidanceY + 90;
    
    if (data.aiAdvice.warnings && data.aiAdvice.warnings.length > 0) {
      doc.fillColor(colorHigh)
         .font('Helvetica-Bold')
         .text('CRITICAL WARNINGS:', 50, listY);
      
      listY += 15;
      data.aiAdvice.warnings.forEach(w => {
        doc.font('Helvetica')
           .fillColor(darkTextColor)
           .text(`• ${w}`, 60, listY, { width: 480 });
        listY += 15;
      });
      listY += 10;
    }

    doc.fillColor(secondaryColor)
       .font('Helvetica-Bold')
       .text('RECOMMENDED ACTION ITEMS:', 50, listY);
    
    listY += 15;
    data.aiAdvice.recommendations.forEach(rec => {
      doc.font('Helvetica')
         .fillColor(darkTextColor)
         .text(`• ${rec}`, 60, listY, { width: 480 });
      listY += 15;
    });

    listY += 10;
    doc.fillColor(colorHealthy)
       .font('Helvetica-Bold')
       .text('SAVINGS & BUDGETING TIPS:', 50, listY);

    listY += 15;
    const tips = data.aiAdvice.savingsTips || data.aiAdvice.budgetingTips || [];
    tips.forEach(tip => {
      doc.font('Helvetica')
         .fillColor(darkTextColor)
         .text(`• ${tip}`, 60, listY, { width: 480 });
      listY += 15;
    });

    // Page 2 Footer
    doc.fontSize(8)
       .fillColor('#A0AEC0')
       .text('Generated by AI Debt Guidance Platform - Page 2 of 2', 50, 770, { align: 'center' });

    // End Document
    doc.end();
  }
}

module.exports = PDFReportService;
