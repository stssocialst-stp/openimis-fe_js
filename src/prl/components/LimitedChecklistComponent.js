import { useState, useEffect } from "react";
import { Box, Checkbox, FormControlLabel, Typography, Paper } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
  container: {
    padding: theme.spacing(2),
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
  },
  itemContainer: {
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1),
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#fafafa",
    },
  },
  itemContainerDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
    cursor: "not-allowed",
  },
  itemContainerSelected: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
  },
  checkboxSelected: {
    color: "#4caf50 !important",
  },
  description: {
    marginLeft: theme.spacing(1),
    color: "#333",
    fontSize: "14px",
  },
  descriptionDisabled: {
    color: "#999",
  },
  counterContainer: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: "#e3f2fd",
    borderRadius: "4px",
    textAlign: "center",
  },
  counterText: {
    fontWeight: "bold",
    color: "#1976d2",
  },
});

function LimitedChecklistComponent(props) {
  const { classes, items = [], maxSelections = 2, onSelectionChange, selections = {} } = props;

  const [localSelections, setLocalSelections] = useState(selections || {});

  useEffect(() => {
    setLocalSelections(selections || {});
  }, [selections]);

  const selectedCount = Object.values(localSelections).filter((item) => item && item.confirmacao).length;
  const isAtLimit = selectedCount >= maxSelections;

  const handleCheckboxChange = (itemId, item) => {
    const currentSelection = localSelections[itemId];

    // Se está selecionado, desseleciona
    if (currentSelection?.confirmacao) {
      const updated = {
        ...localSelections,
        [itemId]: { ...item, confirmacao: false },
      };
      setLocalSelections(updated);
      if (onSelectionChange) {
        onSelectionChange(updated);
      }
    }
    // Se não está selecionado e não está no limite, seleciona
    else if (!isAtLimit) {
      const updated = {
        ...localSelections,
        [itemId]: { ...item, confirmacao: true },
      };
      setLocalSelections(updated);
      if (onSelectionChange) {
        onSelectionChange(updated);
      }
    }
  };

  return (
    <Box className={classes.container}>
      {items.map((item) => {
        const isSelected = localSelections[item.id]?.confirmacao || false;
        const isDisabled = !isSelected && isAtLimit;

        return (
          <Box
            key={item.id}
            className={`${classes.itemContainer} ${isDisabled ? classes.itemContainerDisabled : ""
              } ${isSelected ? classes.itemContainerSelected : ""}`}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleCheckboxChange(item.id, item)}
                  disabled={isDisabled}
                  color="primary"
                  className={isSelected ? classes.checkboxSelected : ""}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className={`${classes.description} ${isDisabled ? classes.descriptionDisabled : ""
                    }`}
                >
                  {item.description}
                </Typography>
              }
              style={{ margin: 0, width: "100%" }}
            />
          </Box>
        );
      })}

      <Box className={classes.counterContainer}>
        <Typography className={classes.counterText}>
          Selecionados: {selectedCount}/{maxSelections}
        </Typography>
      </Box>
    </Box>
  );
}

export default withStyles(styles)(LimitedChecklistComponent);
