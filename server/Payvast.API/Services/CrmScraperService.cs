using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using PuppeteerSharp;
using PuppeteerSharp.Input;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using Microsoft.Extensions.DependencyInjection;
using System.Globalization;

namespace Payvast.API.Services
{
    public class CrmScraperService
    {
        private const string CRM_URL = "http://192.168.12.44/";
        private const string USERNAME = "امین موسوی";
        private const string PASSWORD = "Payvast@35330";
        private const string PROJECTS_LIST_URL = "http://192.168.12.44/#page=0&limit=100&view_type=list&model=perp.crm.projects&menu_id=756&module_id=747&action=979";

        private readonly IServiceScopeFactory _scopeFactory;

        public CrmScraperService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        private async Task<bool> GetShowBrowserSettingAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "ShowBrowserDuringCrmScrape");
                return setting == null || setting.IsEnabled; // Default true (Show Browser)
            }
        }

        public async System.Threading.Tasks.Task SyncCrmDataAsync()
        {
            string startDateFilter = "1400/01/01";
            bool showBrowser = await GetShowBrowserSettingAsync();

            var projects = await ScrapeProjectsInternalAsync(startDateFilter, showBrowser);

            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                context.CrmProjectCache.RemoveRange(context.CrmProjectCache);
                await context.SaveChangesAsync();

                var cacheEntries = projects.Select(p => new CrmProjectCache
                {
                    CrmCode = p.CrmCode,
                    Title = p.Title,
                    BuyerName = p.BuyerName,
                    ProjectManager = p.ProjectManager,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    SupportType = p.SupportType,
                    Credit = p.Credit,
                    CommittedHours = p.CommittedHours,
                    LastUpdated = DateTime.UtcNow
                });

                await context.CrmProjectCache.AddRangeAsync(cacheEntries);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<CrmProjectImportDto>> GetCachedProjectsAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                var existingCrmCodes = await context.Projects
                    .Where(p => !string.IsNullOrEmpty(p.CrmCode))
                    .Select(p => p.CrmCode)
                    .ToListAsync();

                var cached = await context.CrmProjectCache
                    .AsNoTracking()
                    .ToListAsync();

                return cached
                    .Where(c => !existingCrmCodes.Contains(c.CrmCode))
                    .Select(c => new CrmProjectImportDto
                    {
                        CrmCode = c.CrmCode,
                        Title = c.Title,
                        BuyerName = c.BuyerName,
                        ProjectManager = c.ProjectManager,
                        Status = c.Status,
                        StartDate = c.StartDate,
                        EndDate = c.EndDate,
                        SupportType = c.SupportType,
                        Credit = c.Credit,
                        CommittedHours = c.CommittedHours
                    })
                    .ToList();
            }
        }
        
        public async Task<DateTime?> GetLastUpdateTimeAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var lastItem = await context.CrmProjectCache.OrderByDescending(c => c.LastUpdated).FirstOrDefaultAsync();
                return lastItem?.LastUpdated;
            }
        }

        private async Task<List<CrmProjectImportDto>> ScrapeProjectsInternalAsync(string endDateJalali, bool showBrowser)
        {
            Console.WriteLine("🚀 Starting Background CRM Sync...");
            
            string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromePath)) chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";

            var launchOptions = new LaunchOptions
            {
                ExecutablePath = chromePath,
                Headless = !showBrowser,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox", "--start-maximized" },
                DefaultViewport = new ViewPortOptions { Width = 1920, Height = 1080 }
            };

            using var browser = await Puppeteer.LaunchAsync(launchOptions);
            var page = await browser.NewPageAsync();
            
            var downloadPath = Path.Combine(Directory.GetCurrentDirectory(), "TempDownloads");
            if (!Directory.Exists(downloadPath)) Directory.CreateDirectory(downloadPath);
            foreach (var f in Directory.GetFiles(downloadPath)) try { File.Delete(f); } catch { }

            await page.Client.SendAsync("Page.setDownloadBehavior", new { behavior = "allow", downloadPath = downloadPath });
            page.DefaultTimeout = 300000;

            try
            {
                // 1. Login
                await page.EvaluateExpressionAsync($"window.location.href = '{CRM_URL}'");
                await System.Threading.Tasks.Task.Delay(3000);

                await page.EvaluateFunctionAsync($@"(u, p) => {{
                    const userLogin = document.querySelector('input[name=""login""]');
                    const passLogin = document.querySelector('input[name=""password""]');
                    const btnLogin = document.querySelector('button.pf_submit');
                    if (userLogin && passLogin && btnLogin) {{
                        userLogin.value = u; passLogin.value = p; btnLogin.click();
                    }}
                }}", USERNAME, PASSWORD);

                await System.Threading.Tasks.Task.Delay(5000);

                // 2. Click Tile "Buyer Management"
                var moduleSelector = "a[href*='module_id=747']";
                await page.WaitForSelectorAsync(moduleSelector, new WaitForSelectorOptions { Timeout = 20000 });
                await page.ClickAsync(moduleSelector);
                await System.Threading.Tasks.Task.Delay(3000);

                // 3. Force Navigate to Projects List
                await page.EvaluateFunctionAsync($"(url) => {{ window.location.href = url; }}", PROJECTS_LIST_URL);
                await System.Threading.Tasks.Task.Delay(5000);

                // Set 'To Date' filter to Today
                Console.WriteLine("    📅 Setting 'To Date' filter to Today...");
                await page.EvaluateFunctionAsync(@"() => {
                    const calendars = document.querySelectorAll('.fa-calendar.pf_datepicker_trigger');
                    if (calendars.length >= 2) {
                        calendars[1].click();
                    }
                }");
                await System.Threading.Tasks.Task.Delay(1500);
                await page.EvaluateFunctionAsync(@"() => {
                    const todayBtn = Array.from(document.querySelectorAll('.ui-datepicker-current, button')).find(b => b.textContent.includes('امروز') || b.textContent.includes('Today'));
                    if (todayBtn) todayBtn.click();
                }");
                await System.Threading.Tasks.Task.Delay(1500);

                // 4. Find Frame & Set Pagination
                var targetFrame = await WaitForSelectorInAnyFrame(page, "button.pf_searchview_search");
                await targetFrame.EvaluateFunctionAsync(@"() => { (document.querySelector('.select_pages_section .select_pages'))?.click(); }");
                await System.Threading.Tasks.Task.Delay(1000);
                await page.EvaluateFunctionAsync(@"() => { (document.querySelector('span[row-count=""NaN""]'))?.click(); }");
                await System.Threading.Tasks.Task.Delay(15000);

                // 5. Select All & Export
                await targetFrame.EvaluateFunctionAsync(@"() => { (document.querySelector('input.pf_list_record_selector'))?.click(); }");
                await System.Threading.Tasks.Task.Delay(3000);

                var rowElement = await targetFrame.QuerySelectorAsync(".pf_tr[data-id]");
                if (rowElement != null)
                {
                    var box = await rowElement.BoundingBoxAsync();
                    await page.Mouse.MoveAsync(box.X + box.Width / 2, box.Y + box.Height / 2);
                    await page.Mouse.DownAsync(new ClickOptions { Button = MouseButton.Right });
                    await page.Mouse.UpAsync(new ClickOptions { Button = MouseButton.Right });
                }
                await System.Threading.Tasks.Task.Delay(2000);

                await page.EvaluateFunctionAsync(@"() => { const spans = Array.from(document.querySelectorAll('span')); const target = spans.find(s => s.textContent.includes('ارسال به Excel') || s.textContent.includes('Export to Excel')); target?.click(); }");
                await System.Threading.Tasks.Task.Delay(3000);
                await page.EvaluateFunctionAsync(@"() => { const btn = document.querySelector('button.pf_form_button_save.btn-success'); btn?.click(); }");

                // 6. Download
                string downloadedFile = null;
                for (int i = 0; i < 60; i++)
                {
                    await System.Threading.Tasks.Task.Delay(2000);
                    var files = Directory.GetFiles(downloadPath, "*.*").Where(f => !f.EndsWith(".crdownload")).ToList();
                    if (files.Any()) { downloadedFile = files.OrderByDescending(f => new FileInfo(f).LastWriteTime).First(); break; }
                }

                if (downloadedFile == null) throw new Exception("Download timed out.");
                
                await browser.CloseAsync(); 

                return ParseCrmFile(downloadedFile);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Background Sync Failed: {ex.Message}");
                await browser.CloseAsync();
                return new List<CrmProjectImportDto>();
            }
        }

        private async Task<IFrame> WaitForSelectorInAnyFrame(IPage page, string selector)
        {
            for (int i = 0; i < 30; i++)
            {
                if (await page.QuerySelectorAsync(selector) != null) return page.MainFrame;
                foreach (var frame in page.Frames)
                {
                    try { if (await frame.QuerySelectorAsync(selector) != null) return frame; } catch { continue; }
                }
                await System.Threading.Tasks.Task.Delay(2000);
            }
            throw new Exception($"Timeout waiting for selector: {selector}");
        }

        private List<CrmProjectImportDto> ParseCrmFile(string filePath)
        {
            var result = new List<CrmProjectImportDto>();
            try
            {
                string content = File.ReadAllText(filePath).Trim();
                content = Regex.Replace(content, @"<(ss:)?Styles>.*?</(ss:)?Styles>", string.Empty, RegexOptions.Singleline);
                int xmlStart = content.IndexOf("<?xml");
                if (xmlStart >= 0) content = content.Substring(xmlStart);

                XmlDocument doc = new XmlDocument();
                XmlReaderSettings settings = new XmlReaderSettings { CheckCharacters = false, DtdProcessing = DtdProcessing.Ignore };
                using (var stringReader = new StringReader(content))
                using (var xmlReader = XmlReader.Create(stringReader, settings))
                {
                    doc.Load(xmlReader);
                }

                XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                nsmgr.AddNamespace("ss", "urn:schemas-microsoft-com:office:spreadsheet");

                var rows = doc.SelectNodes("//ss:Row", nsmgr);
                if (rows == null || rows.Count < 2) return result;

                var headerRow = rows[0];
                var colMap = new Dictionary<string, int>();
                int cIdx = 0;
                foreach (XmlNode cell in headerRow.SelectNodes("ss:Cell", nsmgr))
                {
                    string val = cell.SelectSingleNode("ss:Data", nsmgr)?.InnerText ?? "";
                    val = val.Replace("ك", "ک").Replace("ي", "ی").Trim();
                    if (!string.IsNullOrEmpty(val)) colMap[val] = cIdx;
                    cIdx++;
                }

                for (int i = 1; i < rows.Count; i++)
                {
                    var cells = rows[i].SelectNodes("ss:Cell", nsmgr);
                    if (cells == null) continue;

                    string GetValue(string key) {
                        if (colMap.TryGetValue(key, out int idx) && idx < cells.Count)
                            return cells[idx].SelectSingleNode("ss:Data", nsmgr)?.InnerText ?? "";
                        return "";
                    }

                    var dto = new CrmProjectImportDto {
                        CrmCode = GetValue("کد"),
                        Title = GetValue("نام"),
                        BuyerName = GetValue("شخص حقوقی"),
                        Status = GetValue("وضعیت خدمات"),
                        StartDate = GetValue("تاریخ آغاز"),
                        EndDate = GetValue("تاریخ پایان"),
                        ProjectManager = GetValue("مدیر پروژه"),
                        Credit = GetValue("اعتبار"),
                        SupportType = GetValue("سطح خدمات"),
                        CommittedHours = int.TryParse(GetValue("خدمات تعهد شده"), out int hours) ? hours : (int?)null
                    };

                    if (!string.IsNullOrEmpty(dto.CrmCode) && (dto.Status.Contains("INS") || dto.Status.Contains("INSL")))
                    {
                        result.Add(dto);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ❌ Parsing Error: {ex.Message}");
            }
            return result;
        }

        // ==================================================================================
        // Section 2: Management of Detailed Actions with HashtagRules Support
        // ==================================================================================

        public async System.Threading.Tasks.Task SyncProjectActionsAsync(int internalProjectId, string crmCode, string projectName)
        {
            Console.WriteLine($"--- ACTION SYNC START: {projectName} (Code: {crmCode}) ---");
            
            bool showBrowser = await GetShowBrowserSettingAsync();

            string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromePath)) chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";

            var launchOptions = new LaunchOptions {
                ExecutablePath = chromePath,
                Headless = !showBrowser,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox", "--start-maximized", "--ignore-certificate-errors" },
                DefaultViewport = new ViewPortOptions { Width = 1920, Height = 1080 }
            };

            using var browser = await Puppeteer.LaunchAsync(launchOptions);
            var page = await browser.NewPageAsync();
            var downloadPath = Path.Combine(Directory.GetCurrentDirectory(), "TempActions");
            if (!Directory.Exists(downloadPath)) Directory.CreateDirectory(downloadPath);
            foreach (var f in Directory.GetFiles(downloadPath)) try { File.Delete(f); } catch { }

            await page.Client.SendAsync("Page.setDownloadBehavior", new { behavior = "allow", downloadPath = downloadPath });
            page.DefaultTimeout = 300000;

            try
            {
                await page.EvaluateExpressionAsync($"window.location.href = '{CRM_URL}'");
                await System.Threading.Tasks.Task.Delay(5000);

                await page.EvaluateFunctionAsync($@"(u, p) => {{
                    const userLogin = document.querySelector('input[name=""login""]');
                    const passLogin = document.querySelector('input[name=""password""]');
                    const btnLogin = document.querySelector('button.pf_submit');
                    if (userLogin && passLogin && btnLogin) {{
                        userLogin.value = u; passLogin.value = p; btnLogin.click();
                    }}
                }}", USERNAME, PASSWORD);
                await System.Threading.Tasks.Task.Delay(5000);

                var moduleSelector = "a[href*='module_id=747']";
                await page.WaitForSelectorAsync(moduleSelector, new WaitForSelectorOptions { Timeout = 20000 });
                await page.ClickAsync(moduleSelector);
                await System.Threading.Tasks.Task.Delay(3000);

                await page.EvaluateFunctionAsync($"(url) => {{ window.location.href = url; }}", PROJECTS_LIST_URL);
                await System.Threading.Tasks.Task.Delay(5000);

                Console.WriteLine("    📅 Setting End Date filter to Today...");
                await page.EvaluateFunctionAsync(@"() => {
                    const calIcons = document.querySelectorAll('.fa-calendar.pf_datepicker_trigger');
                    if(calIcons.length >= 2) { calIcons[1].click(); }
                }");
                await System.Threading.Tasks.Task.Delay(2000);
                await page.EvaluateFunctionAsync(@"() => {
                    const todayBtn = Array.from(document.querySelectorAll('.ui-datepicker-current, button')).find(b => b.textContent.includes('امروز') || b.textContent.includes('Today'));
                    if(todayBtn) todayBtn.click();
                }");
                await System.Threading.Tasks.Task.Delay(2000);

                Console.WriteLine($"    🔍 Typing CRM Code: {crmCode}...");
                await page.WaitForSelectorAsync(".pf_searchview_input");
                await page.ClickAsync(".pf_searchview_input");
                await page.Keyboard.DownAsync("Control");
                await page.Keyboard.PressAsync("A");
                await page.Keyboard.UpAsync("Control");
                await page.Keyboard.PressAsync("Backspace");
                await System.Threading.Tasks.Task.Delay(1500);
                await page.TypeAsync(".pf_searchview_input", crmCode.Trim(), new TypeOptions { Delay = 200 });
                await System.Threading.Tasks.Task.Delay(1000);
                await page.EvaluateFunctionAsync(@"() => {
                    const items = Array.from(document.querySelectorAll('ul.ui-autocomplete li a'));
                    const target = items.find(a => a.textContent.includes('جست‌وجو کد') || a.textContent.includes('Search Code'));
                    if(target) target.click();
                }");
                await System.Threading.Tasks.Task.Delay(1000);

                Console.WriteLine("    🖱️ Opening Project Detail...");
                await page.EvaluateFunctionAsync(@"() => {
                    const firstRow = document.querySelector('.pf_tr[data-id]');
                    if (firstRow) {
                        const targetLabel = firstRow.querySelector('label');
                        if (targetLabel) {
                            const dblClickEvent = new MouseEvent('dblclick', { 'view': window, 'bubbles': true, 'cancelable': true });
                            targetLabel.dispatchEvent(dblClickEvent);
                        }
                    }
                }");
                await System.Threading.Tasks.Task.Delay(2000);

                await page.EvaluateFunctionAsync(@"() => {
                    const spans = Array.from(document.querySelectorAll('button span'));
                    const target = spans.find(s => s.textContent.includes('اقدامات مرتبط') || s.textContent.includes('Related Actions'));
                    if(target) target.parentElement.click();
                }");
                await System.Threading.Tasks.Task.Delay(3000);

                Console.WriteLine("    📅 Setting 'From Date' to 1403/01/01...");
                await page.EvaluateFunctionAsync(@"() => {
                    const inputs = document.querySelectorAll('input.pf_datepicker_master');
                    if (inputs.length >= 3) {
                        const target = inputs[2];
                        target.value = '1403/01/01';
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        target.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }");
                await System.Threading.Tasks.Task.Delay(1000);

                await page.EvaluateFunctionAsync(@"() => {
                    const searchBtn = Array.from(document.querySelectorAll('.pf_searchview_search')).find(el => el.offsetWidth > 0);
                    if(searchBtn) searchBtn.click();
                }");
                await System.Threading.Tasks.Task.Delay(6000);

                Console.WriteLine("    ♾️ Setting view to Unlimited...");
                await page.EvaluateFunctionAsync(@"() => {
                    const btn = Array.from(document.querySelectorAll('.select_pages')).find(el => el.offsetWidth > 0);
                    if(btn) btn.click();
                }");
                await System.Threading.Tasks.Task.Delay(2000);
                await page.EvaluateFunctionAsync(@"() => {
                    const opt = Array.from(document.querySelectorAll('li')).find(l => l.textContent.includes('نا محدود') || l.textContent.includes('Unlimited'));
                    if(opt) opt.click();
                }");
                await System.Threading.Tasks.Task.Delay(6000);

                Console.WriteLine("    📥 Selecting all and Exporting...");
                await page.EvaluateFunctionAsync(@"() => {
                    const chk = Array.from(document.querySelectorAll('input.pf_list_record_selector')).find(el => el.offsetWidth > 0);
                    if(chk) {
                        chk.click(); 
                        if(!chk.checked) chk.parentElement.click(); 
                    }
                }");
                await System.Threading.Tasks.Task.Delay(2000);

                var visibleRowHandle = await page.EvaluateFunctionHandleAsync(@"() => {
                    return Array.from(document.querySelectorAll('.pf_tr')).find(r => r.offsetHeight > 0 && r.getClientRects().length > 0);
                }");
                var visibleRow = visibleRowHandle as IElementHandle;
                if (visibleRow != null)
                {
                    var box = await visibleRow.BoundingBoxAsync();
                    if (box != null)
                    {
                        await page.Mouse.MoveAsync(box.X + box.Width / 2, box.Y + box.Height / 2);
                        await page.Mouse.DownAsync(new ClickOptions { Button = MouseButton.Right });
                        await page.Mouse.UpAsync(new ClickOptions { Button = MouseButton.Right });
                        Console.WriteLine("    🖱️ Right Click Performed on Visible Row.");
                    }
                }
                await System.Threading.Tasks.Task.Delay(2000);

                await page.EvaluateFunctionAsync(@"() => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    const target = spans.find(s => s.textContent.includes('ارسال به Excel') || s.textContent.includes('Export to Excel'));
                    if(target) target.click();
                }");
                Console.WriteLine("    🖱️ Clicked 'Send to Excel' menu item.");
                await System.Threading.Tasks.Task.Delay(3000);

                await page.EvaluateFunctionAsync(@"() => {
                    const buttons = Array.from(document.querySelectorAll('button.btn-success'));
                    const targetBtn = buttons.find(b => b.offsetWidth > 0 && (b.textContent.includes('تأیید') || b.textContent.includes('Confirm')));
                    if(targetBtn) {
                        targetBtn.click();
                    } else {
                        const fallbackBtn = document.querySelector('button.pf_form_button_save.btn-success');
                        if(fallbackBtn) fallbackBtn.click();
                    }
                }");
                await System.Threading.Tasks.Task.Delay(6000);

                await page.EvaluateFunctionAsync(@"() => {
                    const links = Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('/web/save/external') && a.offsetWidth > 0);
                    if(links) links.click();
                }");

                string downloadedFile = await WaitForDownloadActions(downloadPath);
                if (downloadedFile != null) {
                    var actions = ParseActionsExcel(downloadedFile);
                    await SaveActionsToDb(internalProjectId, actions);
                    Console.WriteLine("✅ Actions Synced Successfully.");
                }
            }
            catch (Exception ex) {
                Console.WriteLine($"❌ Error: {ex.Message}");
                await System.Threading.Tasks.Task.Delay(2000); 
            }
            finally { await browser.CloseAsync(); }
        }

        private async System.Threading.Tasks.Task<string> WaitForDownloadActions(string path)
        {
            for (int i = 0; i < 60; i++)
            {
                await System.Threading.Tasks.Task.Delay(2000);
                var files = Directory.GetFiles(path, "*.*").Where(f => !f.EndsWith(".crdownload")).ToList();
                if (files.Any()) return files.OrderByDescending(f => new FileInfo(f).LastWriteTime).First();
            }
            return null;
        }

        private string FormatExcelTime(string rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue)) return "00:00";
            if (rawValue.Contains(":")) return rawValue;
            if (double.TryParse(rawValue, NumberStyles.Any, CultureInfo.InvariantCulture, out double fraction))
            {
                TimeSpan time = TimeSpan.FromDays(fraction);
                return $"{(int)time.TotalHours:D2}:{time.Minutes:D2}";
            }
            return rawValue;
        }

        private List<CrmActionDto> ParseActionsExcel(string filePath)
        {
            var result = new List<CrmActionDto>();
            try {
                string content = File.ReadAllText(filePath);
                content = Regex.Replace(content, @"<(ss:)?Styles>.*?</(ss:)?Styles>", string.Empty, RegexOptions.Singleline);
                int xmlStart = content.IndexOf("<?xml"); if (xmlStart >= 0) content = content.Substring(xmlStart);
                
                XmlDocument doc = new XmlDocument();
                XmlReaderSettings settings = new XmlReaderSettings { CheckCharacters = false, DtdProcessing = DtdProcessing.Ignore };
                using (var stringReader = new StringReader(content))
                using (var xmlReader = XmlReader.Create(stringReader, settings))
                {
                    doc.Load(xmlReader);
                }

                XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
                nsmgr.AddNamespace("ss", "urn:schemas-microsoft-com:office:spreadsheet");
                
                var rows = doc.SelectNodes("//ss:Row", nsmgr);
                if (rows == null || rows.Count < 2) return result;

                var colMap = new Dictionary<string, int>(); 
                var headerCells = rows[0].SelectNodes("ss:Cell", nsmgr);
                int cIdx = 0;
                foreach (XmlNode cell in headerCells)
                {
                    string name = cell.SelectSingleNode("ss:Data", nsmgr)?.InnerText.Trim() ?? "";
                    if (!string.IsNullOrEmpty(name)) colMap[name] = cIdx;
                    cIdx++;
                }

                for (int i = 1; i < rows.Count; i++) {
                    var cells = rows[i].SelectNodes("ss:Cell", nsmgr);
                    if (cells == null) continue;

                    string GetVal(string key) {
                        if (colMap.TryGetValue(key, out int idx) && idx < cells.Count)
                            return cells[idx].SelectSingleNode("ss:Data", nsmgr)?.InnerText ?? "";
                        return "";
                    }
                    
                    var rawDuration = GetVal("مدت زمان اقدام");
                    var formattedDuration = FormatExcelTime(rawDuration);

                    var act = new CrmActionDto { 
                        User = GetVal("کاربر"), 
                        ActionDateStr = GetVal("تاریخ و زمان اقدام"), 
                        ActivityType = GetVal("نوع فعالیت"), 
                        Duration = formattedDuration, 
                        Description = GetVal("شرح اقدام"), 
                        NextAction = GetVal("اقدام بعدی") 
                    };
                    if(!string.IsNullOrEmpty(act.User) || !string.IsNullOrEmpty(act.Description)) result.Add(act);
                }
            } catch (Exception ex) {
                Console.WriteLine($"    ❌ Parsing Actions Error: {ex.Message}");
            }
            return result;
        }

        private async System.Threading.Tasks.Task SaveActionsToDb(int projectId, List<CrmActionDto> actions)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                context.CrmActions.RemoveRange(context.CrmActions.Where(a => a.ProjectId == projectId));
                
                var hashtagRules = await context.HashtagRules.ToListAsync();
                var statusRules = await context.CrmStatusRules.ToListAsync();
                
                foreach (var act in actions)
                {
                    DateTime actionDate = DateTime.Now;
                    try {
                        if (!string.IsNullOrEmpty(act.ActionDateStr)) {
                            var parts = act.ActionDateStr.Split(' '); 
                            var d = parts[0].Split('/'); 
                            var t = parts[1].Split(':');
                            actionDate = new PersianCalendar().ToDateTime(int.Parse(d[0]), int.Parse(d[1]), int.Parse(d[2]), int.Parse(t[0]), int.Parse(t[1]), int.Parse(t[2]), 0);
                        }
                    } catch {}
                    
                    if (actionDate.Year >= 2021) {
                        context.CrmActions.Add(new CrmAction 
                        { 
                            ProjectId = projectId, 
                            CrmUser = act.User, 
                            ActionDate = actionDate, 
                            ActivityType = act.ActivityType, 
                            Duration = act.Duration, 
                            Description = act.Description, 
                            NextAction = act.NextAction, 
                            ImportedAt = DateTime.UtcNow 
                        });
                        
                        foreach (var rule in hashtagRules)
                        {
                            if (!string.IsNullOrEmpty(act.Description) && act.Description.Contains(rule.Hashtag))
                            {
                                var project = await context.Projects.FindAsync(projectId);
                                if (project != null)
                                {
                                    if (rule.TargetType == "ProjectStatus")
                                    {
                                        project.Status = rule.TargetValue;
                                    }
                                    else if (rule.TargetType == "ChecklistStep")
                                    {
                                        var checklistItem = await context.ProjectChecklists
                                            .FirstOrDefaultAsync(c => c.ProjectId == projectId && c.StepName == rule.TargetValue);
                                        if (checklistItem != null && !checklistItem.IsCompleted)
                                        {
                                            checklistItem.IsCompleted = true;
                                            checklistItem.CompletedAt = DateTime.UtcNow;
                                            checklistItem.CompletedByUserId = null; 
                                        }
                                    }
                                }
                            }
                        }
                        
                        foreach (var rule in statusRules) {
                            if (!string.IsNullOrEmpty(act.Description) && act.Description.Contains(rule.Hashtag)) {
                                var p = await context.Projects.FindAsync(projectId);
                                if (p != null) p.Status = rule.TargetStatus;
                            }
                        }
                    }
                }
                await context.SaveChangesAsync();
            }
        }
    }
}