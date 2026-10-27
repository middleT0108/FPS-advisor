using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FpsAdvisor.Core.Models;

namespace FpsAdvisor.Core.Services;

public class ApiSyncResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? SystemProfileId { get; set; }
    public int RecommendationCount { get; set; }
}

public class ApiSyncService
{
    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(15)
    };

    public string SerializePayload(TelemetryPayload payload)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
        return JsonSerializer.Serialize(payload, options);
    }

    public async Task<ApiSyncResult> SubmitToServerAsync(
        string serverBaseUrl,
        TelemetryPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.LinkCode) || payload.LinkCode.Trim().Length != 6)
        {
            return new ApiSyncResult
            {
                Success = false,
                Message = "Mã liên kết phải gồm đúng 6 ký tự!"
            };
        }

        if (!payload.ClientConsentGranted)
        {
            return new ApiSyncResult
            {
                Success = false,
                Message = "Bạn cần đồng ý với chính sách chia sẻ thông số phần cứng trước khi gửi."
            };
        }

        string endpoint = $"{serverBaseUrl.TrimEnd('/')}/api/link/submit";
        string json = SerializePayload(payload);

        try
        {
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, content);
            string responseBody = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            bool isSuccess = root.TryGetProperty("success", out var successProp) && successProp.GetBoolean();
            if (isSuccess)
            {
                string profileId = string.Empty;
                int recCount = 0;

                if (root.TryGetProperty("data", out var dataProp))
                {
                    if (dataProp.TryGetProperty("systemProfileId", out var idProp))
                        profileId = idProp.GetString() ?? string.Empty;
                    if (dataProp.TryGetProperty("recommendationCount", out var countProp))
                        recCount = countProp.GetInt32();
                }

                return new ApiSyncResult
                {
                    Success = true,
                    Message = "Đồng bộ dữ liệu lên Website thành công!",
                    SystemProfileId = profileId,
                    RecommendationCount = recCount
                };
            }
            else
            {
                string errMsg = root.TryGetProperty("error", out var errProp)
                    ? errProp.GetString() ?? "Lỗi không xác định từ máy chủ"
                    : "Lỗi phản hồi từ máy chủ";

                return new ApiSyncResult
                {
                    Success = false,
                    Message = $"Máy chủ từ chối: {errMsg}"
                };
            }
        }
        catch (HttpRequestException ex)
        {
            return new ApiSyncResult
            {
                Success = false,
                Message = $"Không thể kết nối đến máy chủ ({serverBaseUrl}): {ex.Message}. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
            };
        }
        catch (Exception ex)
        {
            return new ApiSyncResult
            {
                Success = false,
                Message = $"Lỗi gửi dữ liệu: {ex.Message}"
            };
        }
    }

    public bool ExportToJsonFile(TelemetryPayload payload, string filePath, out string error)
    {
        error = string.Empty;
        try
        {
            string json = SerializePayload(payload);
            File.WriteAllText(filePath, json, Encoding.UTF8);
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }
}
