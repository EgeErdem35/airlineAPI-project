package com.ege.airlineapigateway.ratelimit;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class QueryRateLimitFilter implements GlobalFilter, Ordered {

    private final QueryRateLimitService queryRateLimitService;

    public QueryRateLimitFilter(QueryRateLimitService queryRateLimitService) {
        this.queryRateLimitService = queryRateLimitService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        boolean isQueryFlightEndpoint =
                "GET".equalsIgnoreCase(method) &&
                        "/api/v1/flights/query".equals(path);

        if (!isQueryFlightEndpoint) {
            return chain.filter(exchange);
        }

        String clientIp = "unknown";
        if (exchange.getRequest().getRemoteAddress() != null &&
                exchange.getRequest().getRemoteAddress().getAddress() != null) {
            clientIp = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }

        if (!queryRateLimitService.isAllowed(clientIp)) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

            String body = """
                    {
                      "title": "Too Many Requests",
                      "status": 429,
                      "detail": "Daily query limit exceeded. Maximum 3 requests per day are allowed.",
                      "path": "/api/v1/flights/query"
                    }
                    """;

            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            return exchange.getResponse()
                    .writeWith(Mono.just(exchange.getResponse()
                            .bufferFactory()
                            .wrap(bytes)));
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}