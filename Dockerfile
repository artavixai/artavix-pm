FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["server/Payvast.API/Payvast.API.csproj", "server/Payvast.API/"]
RUN dotnet restore "server/Payvast.API/Payvast.API.csproj"
COPY . .
WORKDIR "/src/server/Payvast.API"
RUN dotnet publish "Payvast.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "Payvast.API.dll"]