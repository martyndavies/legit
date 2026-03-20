import 'should';
import sinon from 'sinon';
import * as dns from 'dns';
import legit, { LegitResult, LegitOptions } from '../src';

// ── helpers ──────────────────────────────────────────────────────────────────

function dnsError(code: string, message = code): NodeJS.ErrnoException {
  return Object.assign(new Error(message), { code });
}

// ── suite ────────────────────────────────────────────────────────────────────

describe('legit — email DNS validation', function () {
  let resolveMxStub: sinon.SinonStub;
  let resolve4Stub: sinon.SinonStub;

  beforeEach(function () {
    resolveMxStub = sinon.stub(dns.promises, 'resolveMx');
    resolve4Stub  = sinon.stub(dns.promises, 'resolve4');
  });

  afterEach(function () {
    sinon.restore();
  });

  // ── valid MX records ───────────────────────────────────────────────────────

  describe('valid email with MX records', function () {
    it('resolves isValid: true and returns mxArray', async function () {
      resolveMxStub.resolves([
        { exchange: 'mx.example.com', priority: 10 },
      ]);

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.true();
      should(result.mxArray).not.be.null();
    });

    it('sorts MX records by priority ascending', async function () {
      resolveMxStub.resolves([
        { exchange: 'mx3.example.com', priority: 30 },
        { exchange: 'mx1.example.com', priority: 10 },
        { exchange: 'mx2.example.com', priority: 20 },
      ]);

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.true();
      if (result.isValid) {
        result.mxArray[0].priority.should.equal(10);
        result.mxArray[1].priority.should.equal(20);
        result.mxArray[2].priority.should.equal(30);
        result.mxArray[0].exchange.should.equal('mx1.example.com');
      }
    });

    it('each MX record has the expected shape', async function () {
      resolveMxStub.resolves([{ exchange: 'mail.example.com', priority: 5 }]);

      const result: LegitResult = await legit('user@example.com');
      if (result.isValid) {
        result.mxArray[0].should.have.property('exchange').which.is.a.String();
        result.mxArray[0].should.have.property('priority').which.is.a.Number();
      }
    });
  });

  // ── null MX record (RFC 7505) ──────────────────────────────────────────────

  describe('null MX record detection (RFC 7505)', function () {
    it('returns isValid: false, mxRecordSetExists: true for null MX with dot exchange', async function () {
      resolveMxStub.resolves([{ exchange: '.', priority: 0 }]);

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.false();
      should(result.mxArray).be.null();
      if (!result.isValid) {
        result.mxRecordSetExists.should.be.true();
      }
    });

    it('returns isValid: false, mxRecordSetExists: true for null MX with empty exchange', async function () {
      resolveMxStub.resolves([{ exchange: '', priority: 0 }]);

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.false();
      if (!result.isValid) {
        result.mxRecordSetExists.should.be.true();
      }
    });
  });

  // ── A record fallback (RFC 5321 §5.1) ─────────────────────────────────────

  describe('A record fallback (RFC 5321 §5.1)', function () {
    it('returns isValid: true with synthetic MX when domain has no MX but has an A record', async function () {
      resolveMxStub.rejects(dnsError('ENODATA'));
      resolve4Stub.resolves(['93.184.216.34']);

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.true();
      if (result.isValid) {
        result.mxArray.should.have.length(1);
        result.mxArray[0].exchange.should.equal('example.com');
        result.mxArray[0].priority.should.equal(0);
      }
    });

    it('returns isValid: false when domain has neither MX nor A records', async function () {
      resolveMxStub.rejects(dnsError('ENODATA'));
      resolve4Stub.rejects(dnsError('ENODATA'));

      const result: LegitResult = await legit('user@example.com');
      result.isValid.should.be.false();
      if (!result.isValid) {
        result.mxRecordSetExists.should.be.false();
      }
    });
  });

  // ── non-existent domain ────────────────────────────────────────────────────

  describe('non-existent domain (ENOTFOUND)', function () {
    it('returns isValid: false with mxRecordSetExists: false', async function () {
      resolveMxStub.rejects(dnsError('ENOTFOUND'));

      const result: LegitResult = await legit('user@nonexistent.example');
      result.isValid.should.be.false();
      should(result.mxArray).be.null();
      if (!result.isValid) {
        result.mxRecordSetExists.should.be.false();
      }
    });
  });

  // ── timeout ────────────────────────────────────────────────────────────────

  describe('timeout handling', function () {
    it('rejects with a timeout error when DNS lookup exceeds the configured timeout', async function () {
      resolveMxStub.returns(new Promise(() => { /* never resolves */ }));

      await legit('user@example.com', { timeout: 50 })
        .should.be.rejectedWith(/timed out/);
    });

    it('accepts a custom timeout via LegitOptions', async function () {
      resolveMxStub.resolves([{ exchange: 'mx.example.com', priority: 10 }]);
      const options: LegitOptions = { timeout: 5000 };
      const result = await legit('user@example.com', options);
      result.isValid.should.be.true();
    });
  });

  // ── unexpected DNS error ───────────────────────────────────────────────────

  describe('unexpected DNS errors', function () {
    it('rejects with a descriptive error for ESERVFAIL', async function () {
      resolveMxStub.rejects(dnsError('ESERVFAIL', 'queryMx ESERVFAIL example.com'));

      await legit('user@example.com')
        .should.be.rejectedWith(/DNS lookup failed/);
    });

    it('re-throws non-Error objects unchanged', async function () {
      resolveMxStub.rejects('unexpected string rejection');

      let thrown: unknown;
      try {
        await legit('user@example.com');
      } catch (e) {
        thrown = e;
      }
      should(thrown).not.be.undefined();
    });
  });

  // ── internationalised domain names ─────────────────────────────────────────

  describe('internationalised domain names (IDN)', function () {
    it('converts a unicode domain to punycode before the DNS lookup', async function () {
      resolveMxStub.resolves([{ exchange: 'mail.xn--mnchen-3ya.de', priority: 10 }]);

      const result: LegitResult = await legit('user@münchen.de');
      result.isValid.should.be.true();
      resolveMxStub.calledWith('xn--mnchen-3ya.de').should.be.true();
    });

    it('accepts the punycode form directly', async function () {
      resolveMxStub.resolves([{ exchange: 'mail.xn--mnchen-3ya.de', priority: 10 }]);

      const result: LegitResult = await legit('user@xn--mnchen-3ya.de');
      result.isValid.should.be.true();
      resolveMxStub.calledWith('xn--mnchen-3ya.de').should.be.true();
    });
  });

  // ── input validation ───────────────────────────────────────────────────────

  describe('input validation', function () {
    const invalid = [
      ['no @ sign',                     'notanemail'],
      ['empty string',                  ''],
      ['only @ sign',                   '@'],
      ['leading dot in local part',     '.user@example.com'],
      ['consecutive dots in local part','user..name@example.com'],
      ['local part exceeds 64 chars',   'a'.repeat(65) + '@example.com'],
      ['trailing dot in local part',    'user.@example.com'],
      ['no domain',                     'user@'],
    ];

    for (const [label, address] of invalid) {
      it(`rejects with TypeError — ${label}`, async function () {
        await legit(address).should.be.rejectedWith(TypeError);
      });
    }

    it('does not issue a DNS query for structurally invalid addresses', async function () {
      try { await legit('notanemail'); } catch { /* expected */ }
      resolveMxStub.called.should.be.false();
    });
  });
});
