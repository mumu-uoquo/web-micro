<template>
  <div class="login-hero__badge">
    <span class="login-hero__dot" />
    Enterprise Ready
  </div>
  <h1 class="login-hero__title">企业级管理系统</h1>
  <p class="login-hero__subtitle">
    提供安全、高效、可扩展的管理解决方案，助力企业数字化转型与业务增长。
  </p>
  <ul class="login-hero__features">
    <li>
      <span>✓</span>
      统一身份认证与权限管理
    </li>
    <li>
      <span>✓</span>
      支持多租户模式与租户隔离
    </li>
    <li>
      <span>✓</span>
      数据安全与操作审计
    </li>
    <li>
      <span>✓</span>
      灵活扩展与高可用架构
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.login-hero__badge {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: fit-content;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--el-color-primary);
  letter-spacing: 0.06em;
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.login-hero__dot {
  width: 7px;
  height: 7px;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.login-hero__title {
  margin: 1.25rem 0 0.5rem;
  font-size: clamp(1.75rem, 3.5vw, 2.25rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.login-hero__subtitle {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--login-hero-sub);
}

.login-hero__features {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;

  li {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    font-size: 0.9rem;
    font-weight: 500;
    background: var(--login-card-bg);
    border: 1px solid var(--login-card-border);
    border-radius: 10px;
    backdrop-filter: blur(4px);

    span {
      flex-shrink: 0;
      font-weight: 700;
      color: var(--el-color-primary);
    }
  }
}
</style>
