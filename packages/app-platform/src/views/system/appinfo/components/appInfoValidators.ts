type ValidatorCallback = (error?: Error) => void;

function isValidIpv4(value: string): boolean {
  const segments = value.split(".");
  return (
    segments.length === 4 &&
    segments.every((segment) => /^\d{1,3}$/.test(segment) && Number(segment) <= 255)
  );
}

function isValidIpv6(value: string): boolean {
  if (!value.includes(":")) {
    return false;
  }
  try {
    return new URL(`http://[${value}]`).hostname.startsWith("[");
  } catch {
    return false;
  }
}

function isValidIp(value: string): boolean {
  return isValidIpv4(value) || isValidIpv6(value);
}

function isValidDomain(value: string): boolean {
  if (value.length > 253 || !value.includes(".")) {
    return false;
  }

  const labels = value.split(".");
  const validLabel = /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i;
  return labels.every((label) => validLabel.test(label)) && /[a-z]/i.test(labels.at(-1) ?? "");
}

export function validateTrustSite(
  _rule: unknown,
  value: string | undefined,
  callback: ValidatorCallback
): void {
  if (!value || isValidIp(value) || isValidDomain(value)) {
    callback();
    return;
  }
  callback(new Error("请输入有效的域名或 IP 地址"));
}

export function validateTrustIps(
  _rule: unknown,
  value: string | undefined,
  callback: ValidatorCallback
): void {
  if (!value || value.split(";").every((ip) => isValidIp(ip))) {
    callback();
    return;
  }
  callback(new Error("请输入有效的 IP 地址，多个 IP 请使用英文分号分隔"));
}
