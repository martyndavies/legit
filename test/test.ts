import 'should';
import legit, { LegitResult } from '../src';

describe('legit — email DNS validation', function () {
  this.timeout(10000); // Allow for DNS round-trips

  // ── Valid addresses ────────────────────────────────────────────────────────

  describe('valid email with MX records', function () {
    it('resolves isValid: true and returns a sorted mxArray', async () => {
      const result: LegitResult = await legit('martyn@vonage.com');
      result.isValid.should.be.true();
      should(result.mxArray).not.be.null();
      if (result.isValid) {
        result.mxArray.should.be.an.Array();
        result.mxArray.length.should.be.greaterThan(0);
        // Verify MX records are sorted by priority (ascending)
        for (let i = 1; i < result.mxArray.length; i++) {
          (result.mxArray[i].priority >= result.mxArray[i - 1].priority).should.be.true();
        }
        // Each record has the expected shape
        result.mxArray[0].should.have.property('exchange').which.is.a.String();
        result.mxArray[0].should.have.property('priority').which.is.a.Number();
      }
    });
  });

  // ── Invalid domain (no DNS record at all) ─────────────────────────────────

  describe('email with non-existent domain', function () {
    it('resolves isValid: false with mxRecordSetExists: false', async () => {
      const result: LegitResult = await legit('nosir@neverwouldibuythisdomainladdyohno.com');
      result.isValid.should.be.false();
      should(result.mxArray).be.null();
      if (!result.isValid) {
        result.mxRecordSetExists.should.be.false();
      }
    });
  });

  // ── Input validation ───────────────────────────────────────────────────────

  describe('invalid email format — no @ sign', function () {
    it('rejects with a TypeError', async () => {
      await legit('notanemail').should.be.rejectedWith(TypeError);
    });
  });

  describe('invalid email format — empty string', function () {
    it('rejects with a TypeError', async () => {
      await legit('').should.be.rejectedWith(TypeError);
    });
  });

  describe('invalid email format — leading dot in local part', function () {
    it('rejects with a TypeError', async () => {
      await legit('.user@example.com').should.be.rejectedWith(TypeError);
    });
  });

  describe('invalid email format — consecutive dots in local part', function () {
    it('rejects with a TypeError', async () => {
      await legit('user..name@example.com').should.be.rejectedWith(TypeError);
    });
  });

  describe('invalid email format — local part exceeds 64 chars', function () {
    it('rejects with a TypeError', async () => {
      const longLocal = 'a'.repeat(65);
      await legit(`${longLocal}@example.com`).should.be.rejectedWith(TypeError);
    });
  });

  describe('invalid email format — only @ sign', function () {
    it('rejects with a TypeError', async () => {
      await legit('@').should.be.rejectedWith(TypeError);
    });
  });
});
