import { renderHook, act } from "@testing-library/react-hooks";
import { useRulesEngine } from "../";
import { Rule, applyRule, logTo, __clearMocks } from "@totalsoft/pure-rules";

describe("useValidation hook", () => {
    afterEach(() => {
        __clearMocks();
    });

    it("returns model with rule applied to it", () => {
        // Arrange
        const rule = Rule.of(1);
        let returnedModel = undefined;
        const initialModel = { a: { b: "" } };

        // Act
        const { result } = renderHook(() => useRulesEngine(rule, initialModel));
        act(() => {
            const [, , updateField] = result.current;
            returnedModel = updateField("a.b", "OK");
        });

        // Assert
        const [model] = result.current;
        expect(applyRule.mock.calls.length).toBe(1);
        expect(model).toBe(returnedModel);
        expect(model.a.b).toBe("OK");
        expect(model._ruleValue).toBe(1);
    });

    it("enforces reference and render economy if updated with same value", () => {
        // Arrange
        const rule = Rule.of(1);
        const initialModel = { a: { b: "" } };

        // Act
        const { result } = renderHook(() => useRulesEngine(rule, initialModel));
        act(() => {
            const [, , updateField] = result.current;
            updateField("a.b", "OK");
        });
        const [model1] = result.current;
        act(() => {
            const [, , updateField] = result.current;
            updateField("a.b", "OK");
        });
        const [model2] = result.current;
        // Assert
        expect(applyRule.mock.calls.length).toBe(1);
        expect(model1).toBe(model2);
        expect(model1._ruleValue).toBe(1);
    });


    it("returns initial model when rule is not run", () => {
        // Arrange
        const rule = Rule.of(1);
        const initialModel = { a: { b: "" } };

        // Act
        const { result } = renderHook(() => useRulesEngine(rule, initialModel));


        // Assert
        const [model] = result.current;
        expect(model).toBe(initialModel);

    });


    it("returns initial model after reset", () => {
        // Arrange
        const rule = Rule.of(1);
        const initialModel = { a: { b: "" } };

        // Act
        const { result } = renderHook(() => useRulesEngine(rule, initialModel));
        act(() => {
            const [, , updateField] = result.current;
            updateField("a.b", "OK");
        });
        const [model1] = result.current;
        act(() => {
            const [, , , reset] = result.current;
            reset(initialModel);
        });

        // Assert
        const [model2] = result.current;
        expect(model1).not.toBe(initialModel);
        expect(model2).toBe(initialModel);
    });



    it("should minimize the number of renders", () => {
        // Arrange
        const rule = Rule.of(1);
        const initialModel = { a: { b: "" } };
        let renderNo = 0;
        function renderCallack() {
            renderNo = renderNo + 1;
            return useRulesEngine(rule, initialModel);
        }

        // Act
        const { result, rerender } = renderHook(renderCallack);
        act(() => {
            const [, , updateField] = result.current;
            updateField("a.b", "OK");
        });
        rerender();

        // Assert
        expect(renderNo).toBe(3);
    });

    it("calls the logTo HOV function once", () => {
        // Arrange
        const rule = Rule.of(1);
        const logger = { log: _ => { } };
        const initialModel = { a: { b: "" } };

        // Act
        const { result } = renderHook(() => useRulesEngine(rule, initialModel, { isLogEnabled: true, logger }));
        act(() => {
            const [, , updateField] = result.current;
            updateField("a.b", "OK");
        });

        // Assert
        expect(logTo.mock.calls).toEqual([[logger]]);
    });

    it("does not change the returned object references on re-render", () => {
        // Arrange
        const rule = Rule.of(1);
        const initialModel = { a: { b: "" } };

        // Act
        const { result, rerender } = renderHook(() => useRulesEngine(rule, initialModel));
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).toBe(updateField2);
        expect(reset1).toBe(reset2);
    });

    it("changes the updateField function when the rule changes", () => {
        // Arrange
        const initialModel = {}
        const logger = {}
        const callback = () => useRulesEngine(Rule.of(1), initialModel, { logger });

        // Act
        const { result, rerender } = renderHook(callback);
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).not.toBe(updateField2);
        expect(reset1).toBe(reset2);
    });

    it("changes the updateField function when the logger changes", () => {
        // Arrange
        const initialModel = {}
        const rule = Rule.of(1);
        const callback = () => useRulesEngine(rule, initialModel, { logger: {} });

        // Act
        const { result, rerender } = renderHook(callback);
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).not.toBe(updateField2);
        expect(reset1).toBe(reset2);
    });

    it("it doesn't change when when the initial model changes", () => {
        // Arrange
        const rule = Rule.of(1);
        const logger = {}
        const callback = () => useRulesEngine(rule, {}, { logger });

        // Act
        const { result, rerender } = renderHook(callback);
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).toBe(updateField2);
        expect(reset1).toBe(reset2);
    });


    it("changes the validation function when the logging flag changes", () => {
        // Arrange
        const initialModel = {}
        const rule = Rule.of(1);
        let isLogEnabled = true;
        const callback = () => {
            isLogEnabled = !isLogEnabled;
            return useRulesEngine(rule, initialModel, { isLogEnabled: !isLogEnabled });
        }
        
        // Act
        const { result, rerender } = renderHook(callback);
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).not.toBe(updateField2);
        expect(reset1).toBe(reset2);
    });


    it("changes the validation function when  other deps change", () => {
        // Arrange
        const initialModel = {}
        const rule = Rule.of(1);
        let depFlag = true;
        const callback = () => {
            depFlag = !depFlag;
            return useRulesEngine(rule, initialModel, {}, [depFlag]);
        }
        
        // Act
        const { result, rerender } = renderHook(callback);
        const [model1, rule1, updateField1, reset1] = result.current;
        rerender();
        const [model2, rule2, updateField2, reset2] = result.current;

        // Assert
        expect(model1).toBe(model2);
        expect(rule1).toBe(rule2);
        expect(updateField1).not.toBe(updateField2);
        expect(reset1).toBe(reset2);
    });
});
