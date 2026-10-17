---
name: iac-testing-aws-cdk
description: OPTIONAL, AWS CDK-specific. Snapshot and assertion test patterns for CDK stacks and API Gateway routes. Use only when the project defines infrastructure with AWS CDK (TypeScript) and needs infrastructure tests; skip for any other stack.
---

# Infrastructure Testing — AWS CDK (optional)

This skill is deliberately separate from the generic `test-writer` agent so the
core stays stack-agnostic. Load it only for projects that use AWS CDK. For other
IaC tools, write an equivalent skill rather than editing the generic agent.

## Snapshot test
```typescript
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ExampleStack } from '../../../src/infra/stacks/example';

describe('ExampleStack', () => {
  it('should match snapshot', () => {
    const app = new App();
    const stack = new ExampleStack(app, 'TestStack', { env: { region: 'us-east-1' } });
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
```

## Assertion test
Prefer over snapshot-only for anything security- or auth-relevant:
```typescript
template.hasResourceProperties('AWS::ApiGateway::Method', {
  HttpMethod: 'GET',
  AuthorizationType: 'NONE',
});
```

## What to test for new API Gateway routes
1. Method/verb exists at the correct path
2. Auth type is as expected (none / IAM-style / custom)
3. Integration type is as expected
4. Snapshot passes after the change

## Rules
- Only regenerate snapshots for intentional changes; review the snapshot diff.
- A snapshot alone never proves an auth setting is right — assert it explicitly.
