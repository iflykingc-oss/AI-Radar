"""v4.5 Harness Layer.

提供生产级可靠性三件套：
- Retry Layer: 指数退避重试装饰器
- Fallback Layer: 失败降级装饰器
- Observability Layer: 节点耗时+结构化日志+指标收集

提供工具函数：
- get_logger: 获取节点专用 logger
- is_retryable_error: 判断异常是否可重试
"""
from __future__ import annotations

import functools
import logging
import time
from contextlib import contextmanager
from typing import Any, Callable, Dict, Optional, Tuple, Type, TypeVar

# 兼容 Python 3.10+ 的 ParamSpec
try:
    from typing import ParamSpec
except ImportError:  # Python < 3.10
    from typing_extensions import ParamSpec  # type: ignore

P = ParamSpec("P")
R = TypeVar("R")


# ===================== Tool Functions =====================

def get_logger(node_name: str) -> logging.Logger:
    """获取节点专用 logger，自动加上节点名前缀。"""
    return logging.getLogger(f"graph.{node_name}")


def is_retryable_error(exc: BaseException) -> bool:
    """判断异常是否可重试。业务异常(ValueError/KeyError等)不重试，IO/Timeout 异常重试。"""
    if isinstance(exc, (ValueError, KeyError, TypeError, AttributeError)):
        return False
    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return True
    return True  # 默认重试


# ===================== Retry Layer =====================

def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    logger: Optional[logging.Logger] = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """指数退避重试装饰器。

    Args:
        max_retries: 最大重试次数（不含首次执行）
        initial_delay: 初始延迟秒数
        backoff: 退避倍数
        exceptions: 触发重试的异常类型元组
        logger: 日志对象，为空时使用 getLogger(__name__)
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            log = logger or logging.getLogger(__name__)
            delay = initial_delay
            last_exc: Optional[BaseException] = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:  # type: ignore[misc]
                    last_exc = e
                    if attempt >= max_retries:
                        log.error(
                            "[Retry] %s 最终失败，已重试 %d 次: %s",
                            func.__name__, attempt, e,
                        )
                        raise
                    if not is_retryable_error(e):
                        log.warning(
                            "[Retry] %s 不可重试异常: %s", func.__name__, e,
                        )
                        raise
                    log.warning(
                        "[Retry] %s 第 %d 次失败: %s, %.1fs 后重试",
                        func.__name__, attempt + 1, e, delay,
                    )
                    time.sleep(delay)
                    delay *= backoff
            # 理论上不会到这里，但类型守卫需要
            if last_exc is not None:
                raise last_exc
            raise RuntimeError("retry_with_backoff: 未知错误")
        return wrapper
    return decorator


# ===================== Fallback Layer =====================

def with_fallback(
    fallback_fn: Callable[..., Any],
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    logger: Optional[logging.Logger] = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """失败降级装饰器。主函数抛出指定异常时调用 fallback_fn。"""
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
            log = logger or logging.getLogger(__name__)
            try:
                return func(*args, **kwargs)
            except exceptions as e:  # type: ignore[misc]
                log.warning(
                    "[Fallback] %s 失败: %s, 降级到 %s",
                    func.__name__, e, fallback_fn.__name__,
                )
                return fallback_fn(*args, **kwargs)
        return wrapper
    return decorator


# ===================== Observability Layer =====================

class NodeMetricsCollector:
    """节点指标收集器，由 node_metrics contextmanager yield。

    用法：
        with node_metrics("xxx", logger) as m:
            m.add_metric("key", value)
            ...
    在 contextmanager 退出时会自动调用 log_node_result 一次性记录。
    """

    def __init__(self, node_name: str, extra: Optional[dict] = None) -> None:
        self.node_name = node_name
        self.metrics: Dict[str, Any] = dict(extra or {})

    def add_metric(self, key: str, value: Any) -> None:
        """添加一个指标项。"""
        self.metrics[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self.metrics.get(key, default)


@contextmanager
def node_metrics(node_name: str, extra: Optional[dict] = None):
    """节点可观测性 contextmanager。

    自动统计节点耗时，在 finally 块中打印结构化日志。
    同时 yield 一个 NodeMetricsCollector 对象，节点内部可调用 m.add_metric() 添加自定义指标。
    """
    collector = NodeMetricsCollector(node_name, extra)
    start_time = time.time()
    status: str = "success"
    error_msg: str = ""
    try:
        yield collector
    except Exception as e:
        status = "failed"
        error_msg = str(e)
        raise
    finally:
        duration_ms = int((time.time() - start_time) * 1000)
        log_node_result(
            node_name=node_name,
            status=status,
            duration_ms=duration_ms,
            metrics=collector.metrics,
            error=error_msg,
        )


def log_node_result(
    node_name: str,
    status: str,
    duration_ms: int,
    metrics: Optional[Dict[str, Any]] = None,
    error: str = "",
) -> None:
    """以结构化JSON格式记录节点执行结果。"""
    import json
    log = get_logger(node_name)
    payload: Dict[str, Any] = {
        "node": node_name,
        "status": status,
        "duration_ms": duration_ms,
    }
    if metrics:
        payload["metrics"] = metrics
    if error:
        payload["error"] = error
    try:
        log.info(json.dumps(payload, ensure_ascii=False, default=str))
    except Exception:
        # 序列化失败时降级为字符串
        log.info(f"[{node_name}] {status} {duration_ms}ms metrics={metrics} error={error}")
