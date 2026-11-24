import math
import numpy as np
from scipy import integrate
import sympy as sp

def verify_all_math():
    print("=== INDEPENDENT MATH VERIFICATION ===")
    results = []

    # 1. Câu 4 (Part I): log_3(x - 1) = 1
    # x - 1 = 3^1 = 3 => x = 4
    x = sp.Symbol('x')
    eq = sp.Eq(sp.log(x - 1, 3), 1)
    sol = sp.solve(eq, x)
    val = int(sol[0])
    match = (val == 4)
    print(f"Part I Q4: solved={val}, official=B (x=4), match={match}")
    results.append(('MATH_0115_P1_Q04', val, 'B (x=4)', match))

    # 2. Câu 5 (Part I): P(A)=0.5, P(B)=0.4, independent => P(AB) = 0.5 * 0.4 = 0.2
    p_ab = 0.5 * 0.4
    match = (abs(p_ab - 0.2) < 1e-9)
    print(f"Part I Q5: computed={p_ab}, official=C (0,2), match={match}")
    results.append(('MATH_0115_P1_Q05', p_ab, 'C (0,2)', match))

    # 3. Câu 7 (Part I): A(1,5,1), B(3,3,1) => AB = (2, -2, 0)
    ab = (3 - 1, 3 - 5, 1 - 1)
    match = (ab == (2, -2, 0))
    print(f"Part I Q7: computed={ab}, official=B (2;-2;0), match={match}")
    results.append(('MATH_0115_P1_Q07', str(ab), 'B (2;-2;0)', match))

    # 4. Câu 12 (Part I): u_1 = 5, d = -1 => u_2 = 4
    u2 = 5 + (-1)
    match = (u2 == 4)
    print(f"Part I Q12: computed={u2}, official=A (4), match={match}")
    results.append(('MATH_0115_P1_Q12', u2, 'A (4)', match))

    # 5. Part III Q1:
    # Ellipse: x^2 / 1.5^2 + y^2 / 1^2 = 1 => y = sqrt(1 - x^2 / 1.5^2)
    # Hole radius r = 0.2, hole intersects ellipse when y = 0.2 => 1 - x^2 / 1.5^2 = 0.04 => x^2 = 1.5^2 * 0.96 = 2.25 * 0.96 = 2.16 => x = sqrt(2.16)
    # The bead is rotated around Ox.
    # For x in [-sqrt(2.16), sqrt(2.16)], cross section is washer with outer radius y(x) and inner radius r = 0.2.
    # Area A(x) = pi * (y(x)^2 - r^2) = pi * (1 - x^2/2.25 - 0.04) = pi * (0.96 - x^2/2.25).
    # Volume = 2 * pi * \int_0^{sqrt(2.16)} (0.96 - x^2/2.25) dx
    x_max = math.sqrt(2.16)
    # integral of (0.96 - x^2/2.25) from 0 to x_max: 0.96 * x_max - (x_max^3) / (3 * 2.25)
    integ = 0.96 * x_max - (x_max**3) / 6.75
    vol = 2 * math.pi * integ
    vol_rounded = round(vol, 2)
    print(f"Part III Q1: vol={vol:.4f}, rounded={vol_rounded}, official=5,91, match={vol_rounded == 5.91}")
    results.append(('MATH_0115_P3_Q01', vol_rounded, '5,91', vol_rounded == 5.91))

    # 6. Part III Q2:
    # 19x + 14y + 10z = 600
    # 20x + 12y +  8z = 540
    # 25x + 12y +  7z = 570
    # Compute 50x + 25y + 20z
    A = np.array([
        [19, 14, 10],
        [20, 12, 8],
        [25, 12, 7]
    ], dtype=float)
    b = np.array([600, 540, 570], dtype=float)
    prices = np.linalg.solve(A, b)
    # prices: x=rau muong, y=bi xanh, z=ca chua
    sat_cost = 50 * prices[0] + 25 * prices[1] + 20 * prices[2]
    cost_rounded = round(sat_cost)
    print(f"Part III Q2: prices={prices}, sat_cost={sat_cost:.2f}, official=1275, match={cost_rounded == 1275}")
    results.append(('MATH_0115_P3_Q02', cost_rounded, '1275', cost_rounded == 1275))

    # 7. Part III Q5:
    # Cube ABCD.MNPQ with side 6.
    # Coordinate system: D is origin (0,0,0).
    # DA along Ox, DC along Oy, DM along Oz.
    # Then D = (0,0,0)
    # A = (6,0,0), B = (6,6,0), C = (0,6,0)
    # Top face MNPQ above ABCD: M above D => M = (0,0,6)
    # N above A => N = (6,0,6)
    # P above B => P = (6,6,6)
    # Q above C => Q = (0,6,6)
    # E is midpoint of AB => E = (6, 3, 0)
    # Points on plane (MED):
    # M = (0, 0, 6)
    # E = (6, 3, 0)
    # D = (0, 0, 0)
    # Vectors: DM = (0, 0, 6), DE = (6, 3, 0)
    # Normal vector n = DM x DE = (0*0 - 6*3, 6*6 - 0*0, 0*3 - 0*6) = (-18, 36, 0) -> simplify to (-1, 2, 0) or (1, -2, 0).
    # Plane (MED) through D(0,0,0): 1*(x - 0) - 2*(y - 0) + 0*(z - 0) = 0 => x - 2y = 0.
    # Distance from P(6, 6, 6) to plane x - 2y = 0:
    # d = |6 - 2*6| / sqrt(1^2 + (-2)^2) = |-6| / sqrt(5) = 6 / sqrt(5) = 6 * 2.2360679 / 5 = 2.683?
    # WAIT! How are the vertices named in Vietnamese convention?
    # ABCD is the bottom face. MNPQ is the top face with M above A, N above B, P above C, Q above D!
    # Let's re-read vertex labels on page 4!
    # In page 4, the student sketched: bottom ABCD, top MNPQ with M above A!
    # Let's test standard mapping: A->M, B->N, C->P, D->Q!
    # Then:
    # D = (0,0,0), A = (6,0,0), B = (6,6,0), C = (0,6,0)
    # M above A => M = (6,0,6)
    # N above B => N = (6,6,6)
    # P above C => P = (0,6,6)
    # Q above D => Q = (0,0,6)
    # E is midpoint of AB => E = (6, 3, 0)
    # Plane (MED): M(6,0,6), E(6,3,0), D(0,0,0)
    # DM = (6, 0, 6), DE = (6, 3, 0)
    # n = DM x DE = (0 - 18, 36 - 0, 18 - 0) = (-18, 36, 18) -> divide by -18 => (1, -2, -1)
    # Plane equation: 1*x - 2*y - 1*z = 0
    # Point P: P is above C => P = (0, 6, 6)
    # Distance d(P, (MED)) = |0 - 2*6 - 6| / sqrt(1 + 4 + 1) = |-18| / sqrt(6) = 18 / sqrt(6) = 3 * sqrt(6) = 7.348469...
    # Rounded to 2 decimal places: 7.35!
    # EXACT MATCH with official answer 7,35!
    d_P = 18 / math.sqrt(6)
    d_rounded = round(d_P, 2)
    print(f"Part III Q5: d={d_P:.4f}, rounded={d_rounded}, official=7,35, match={d_rounded == 7.35}")
    results.append(('MATH_0115_P3_Q05', d_rounded, '7,35', d_rounded == 7.35))

    # 8. Part III Q6:
    # C(x) = 0.001 x^3 + 30 x + 10
    # R(x) = 60 x
    # Profit P(x) = R(x) - C(x) = 60x - 0.001 x^3 - 30x - 10 = -0.001 x^3 + 30x - 10
    # For x in [1, 200]
    # P'(x) = -0.003 x^2 + 30 = 0 => x^2 = 30 / 0.003 = 10000 => x = 100
    # Maximum profit at x = 100:
    # P(100) = -0.001 * (100^3) + 30 * 100 - 10 = -0.001 * 1000000 + 3000 - 10 = -1000 + 3000 - 10 = 1990!
    # EXACT MATCH with official answer 1990!
    profit = -0.001 * (100**3) + 30 * 100 - 10
    print(f"Part III Q6: max_profit={profit}, official=1990, match={profit == 1990}")
    results.append(('MATH_0115_P3_Q06', int(profit), '1990', profit == 1990))

    # 9. Part III Q4 (Backup Math candidate):
    # Regular 12-gon has 3 squares:
    # Square 1: {A1, A4, A7, A10}
    # Square 2: {A2, A5, A8, A11}
    # Square 3: {A3, A6, A9, A12}
    # Note: These 3 squares partition the 12 vertices into 3 disjoint sets of 4 vertices!
    # Total ways to choose 4 red vertices out of 12 vertices: C(12, 4) = 495.
    # Each square has 4 vertices.
    # We want every square to have AT LEAST ONE red vertex.
    # Since there are 4 red balls and 3 squares, by Pigeonhole Principle, the red balls can be distributed as:
    # (2, 1, 1) in some order:
    # Number of ways to choose which square gets 2 red balls: 3 ways.
    # Ways to place 2 red balls in that square: C(4, 2) = 6 ways.
    # Ways to place 1 red ball in each of the other two squares: C(4, 1) * C(4, 1) = 4 * 4 = 16 ways.
    # Total favorable configurations of vertices: 3 * 6 * 16 = 288.
    # Probability P = 288 / 495 = 32 / 55.
    # Value of 3190 * P = 3190 * (32 / 55) = 58 * 32 = 1856!
    # EXACT MATCH with official answer 1856!
    ways_total = sp.binomial(12, 4)
    ways_favorable = 3 * sp.binomial(4, 2) * sp.binomial(4, 1) * sp.binomial(4, 1)
    prob_P = ways_favorable / ways_total
    val_3190P = int(3190 * prob_P)
    print(f"Part III Q4: P={prob_P}, 3190*P={val_3190P}, official=1856, match={val_3190P == 1856}")
    results.append(('MATH_0115_P3_Q04', val_3190P, '1856', val_3190P == 1856))

    matches = sum(1 for r in results if r[3])
    print(f"\nMath verification result: {matches}/{len(results)} matches.")
    return results

if __name__ == '__main__':
    verify_all_math()

